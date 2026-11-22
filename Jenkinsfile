// =============================================================
// Jenkinsfile — CI cho Car E-commerce
//
// Tài liệu cài đặt / vận hành: docs/CI_JENKINS.md
// Các file liên quan:
//   jenkins/Dockerfile              image Jenkins + Docker CLI + Node + Maven
//   jenkins/plugins.txt             plugin cài sẵn
//   docker-compose.jenkins.yml      chạy Jenkins container
//   scripts/deploy.sh               deploy trên EC2 (pull + up + smoke test)
//   docker-compose.yml              compose gốc
//   docker-compose.prod.yml         overlay production
// =============================================================

def SERVICES = [
    'auth-service',
    'customer-service',
    'order-service',
    'car-service',
    'inventory-service',
    'payment-service'
]

pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 90, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20', daysToKeepStr: '30'))
        disableConcurrentBuilds()
    }

    parameters {
        string(
            name: 'IMAGE_PREFIX',
            defaultValue: 'your-dockerhub-user',
            description: 'Docker Hub namespace. Image sẽ là <prefix>/auth-service, <prefix>/frontend...'
        )
        string(
            name: 'PUBLIC_API_BASE_URL',
            defaultValue: 'http://localhost:8080/api/v1',
            description: 'URL API public mà trình duyệt gọi (thường là http(s)://<EC2-IP>:8080/api/v1)'
        )
        booleanParam(
            name: 'USE_MOCK_API',
            defaultValue: false,
            description: 'Bật mock API trong bundle frontend'
        )
        booleanParam(
            name: 'PUSH_IMAGES',
            defaultValue: true,
            description: 'Push image lên Docker Hub (chỉ áp dụng cho branch main)'
        )
        booleanParam(
            name: 'DEPLOY',
            defaultValue: false,
            description: 'Deploy lên EC2 sau khi push (chỉ branch main)'
        )
        string(
            name: 'DEPLOY_USER',
            defaultValue: 'ubuntu',
            description: 'SSH user của EC2'
        )
        string(
            name: 'DEPLOY_HOST',
            defaultValue: '',
            description: 'IP hoặc DNS của EC2'
        )
        string(
            name: 'PUBLIC_URL',
            defaultValue: '',
            description: 'URL public để smoke test, ví dụ http://<EC2-IP>:3000'
        )
    }

    environment {
        DOCKERHUB_CREDENTIALS = 'dockerhub-credentials'
        SSH_CREDENTIALS      = 'ec2-ssh-key'
        DOCKER_BUILDKIT      = '1'
    }

    stages {
        stage('Prepare') {
            steps {
                script {
                    env.IMAGE_PREFIX = params.IMAGE_PREFIX?.trim() ?: 'your-dockerhub-user'
                    env.API_BASE     = params.PUBLIC_API_BASE_URL?.trim() ?: 'http://localhost:8080/api/v1'
                    env.GIT_SHA      = sh(script: 'git rev-parse --short=7 HEAD', returnStdout: true).trim()
                    env.IMAGE_TAG    = "${env.BUILD_NUMBER}-${env.GIT_SHA}"
                    echo "Branch=${env.BRANCH_NAME}"
                    echo "Image prefix=${env.IMAGE_PREFIX}"
                    echo "Image tag=${env.IMAGE_TAG}"
                    echo "Frontend API=${env.API_BASE}"
                }
            }
        }

        stage('Frontend: install, typecheck, build') {
            steps {
                sh '''
                    npm ci
                    npm run typecheck
                    npm run build
                '''
            }
        }

        stage('Backend: test (parallel)') {
            steps {
                script {
                    def jobs = [:]
                    for (svc in SERVICES) {
                        def service = svc
                        jobs[service] = {
                            dir(service) {
                                sh 'mvn -B -ntp test'
                            }
                        }
                    }
                    parallel jobs
                }
            }
        }

        stage('Docker: build images (parallel)') {
            steps {
                script {
                    def builds = [:]
                    for (svc in SERVICES) {
                        def service = svc
                        builds[service] = {
                            sh "docker build -t '${env.IMAGE_PREFIX}/${service}:${env.IMAGE_TAG}' ./${service}"
                        }
                    }
                    builds['frontend'] = {
                        sh """
                            docker build \
                                -t '${env.IMAGE_PREFIX}/frontend:${env.IMAGE_TAG}' \
                                --build-arg NEXT_PUBLIC_API_BASE_URL=/api \
                                --build-arg NEXT_PUBLIC_API_TIMEOUT=15000 \
                                --build-arg NEXT_PUBLIC_USE_MOCK_API=${params.USE_MOCK_API} \
                                --build-arg NEXT_PUBLIC_USE_BACKEND_SERVICES=true \
                                --build-arg NEXT_PUBLIC_AUTH_API_URL=${env.API_BASE} \
                                --build-arg NEXT_PUBLIC_CUSTOMER_API_URL=${env.API_BASE} \
                                --build-arg NEXT_PUBLIC_ORDER_API_URL=${env.API_BASE} \
                                --build-arg NEXT_PUBLIC_PAYMENT_API_URL=${env.API_BASE} \
                                .
                        """
                    }
                    parallel builds
                }
            }
        }

        stage('Docker: push to Docker Hub') {
            when {
                allOf {
                    branch 'main'
                    expression {
                        params.PUSH_IMAGES &&
                        params.IMAGE_PREFIX?.trim() &&
                        params.IMAGE_PREFIX.trim() != 'your-dockerhub-user'
                    }
                }
            }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: env.DOCKERHUB_CREDENTIALS,
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        set -e
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                        for image in auth-service customer-service order-service car-service inventory-service payment-service frontend; do
                            docker tag "$IMAGE_PREFIX/$image:$IMAGE_TAG" "$IMAGE_PREFIX/$image:latest"
                            docker push "$IMAGE_PREFIX/$image:$IMAGE_TAG"
                            docker push "$IMAGE_PREFIX/$image:latest"
                        done

                        docker logout
                    '''
                }
                script {
                    writeFile file: 'image-tag.txt', text: "${env.IMAGE_PREFIX}/${env.IMAGE_TAG}\n"
                }
            }
        }

        stage('Deploy to EC2') {
            when {
                allOf {
                    branch 'main'
                    expression { params.DEPLOY && params.DEPLOY_HOST?.trim() }
                }
            }
            steps {
                sshagent([env.SSH_CREDENTIALS]) {
                    sh """
                        ssh -o StrictHostKeyChecking=accept-new ${params.DEPLOY_USER}@${params.DEPLOY_HOST} \\
                            'cd /opt/car-ecommerce && IMAGE_TAG=${env.IMAGE_TAG} ./scripts/deploy.sh'
                    """
                }
            }
        }

        stage('Smoke test') {
            when {
                expression { params.DEPLOY && params.PUBLIC_URL?.trim() }
            }
            steps {
                sh """
                    curl -fsS --retry 10 --retry-delay 5 --retry-connrefused \
                        '${params.PUBLIC_URL}/api/health'
                """
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: '**/target/surefire-reports/*.xml'
            archiveArtifacts artifacts: 'image-tag.txt, **/target/surefire-reports/*.xml', allowEmptyArchive: true
        }
        success {
            echo "CI OK — image: ${env.IMAGE_PREFIX}/*:${env.IMAGE_TAG}"
        }
        failure {
            echo "CI FAILED — xem log từng stage ở trên."
        }
    }
}
