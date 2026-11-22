# Jenkins LTS + Docker CLI + Node 20 + Maven 3.9 + JDK 17.
#
# Vì sao cài Node/Maven vào thẳng image?
# Jenkins chạy trong container nhưng build qua Docker daemon của host
# (docker.sock). Nếu dùng `docker run -v $WORKSPACE:...` thì đường dẫn
# $WORKSPACE chỉ tồn tại trong container Jenkins, host không thấy -> test
# sẽ chạy trên thư mục rỗng. Cài tool trực tiếp vào Jenkins container tránh
# hoàn toàn lỗi này; Docker vẫn được dùng để build/push image.
#
# Lệnh `docker build` vẫn hoạt động bình thường vì Docker CLI gửi build
# context qua socket, không cần mount thư mục.
FROM jenkins/jenkins:lts-jdk17

USER root

ARG NODE_VERSION=20.18.0
ARG MAVEN_VERSION=3.9.9
ARG DOCKER_CLI_VERSION=27.5.1
ARG BUILDX_VERSION=0.19.3

ENV MAVEN_HOME=/opt/maven
ENV PATH=${MAVEN_HOME}/bin:/usr/local/bin:${PATH}

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        ca-certificates \
        openssh-client \
        git \
    && rm -rf /var/lib/apt/lists/*

# Docker CLI (static binary). Debian 13 không còn đóng gói CLI trong docker.io.
RUN set -eux; \
    arch="$(dpkg --print-architecture)"; \
    case "$arch" in \
        amd64) docker_arch="x86_64" ;; \
        arm64) docker_arch="aarch64" ;; \
        *) echo "Unsupported architecture: $arch" >&2; exit 1 ;; \
    esac; \
    curl -fsSL "https://download.docker.com/linux/static/stable/${docker_arch}/docker-${DOCKER_CLI_VERSION}.tgz" -o /tmp/docker.tgz; \
    tar -xzf /tmp/docker.tgz -C /tmp; \
    mv /tmp/docker/docker /usr/local/bin/docker; \
    rm -rf /tmp/docker /tmp/docker.tgz; \
    docker --version

# buildx để `docker build` dùng BuildKit (Jenkinsfile đặt DOCKER_BUILDKIT=1).
RUN set -eux; \
    arch="$(dpkg --print-architecture)"; \
    mkdir -p /usr/local/lib/docker/cli-plugins; \
    curl -fsSL "https://github.com/docker/buildx/releases/download/v${BUILDX_VERSION}/buildx-v${BUILDX_VERSION}.linux-${arch}" \
        -o /usr/local/lib/docker/cli-plugins/docker-buildx; \
    chmod +x /usr/local/lib/docker/cli-plugins/docker-buildx; \
    docker buildx version

# Node.js 20 (npm dùng cho frontend)
RUN set -eux; \
    arch="$(dpkg --print-architecture)"; \
    case "$arch" in \
        amd64) node_arch="x64" ;; \
        arm64) node_arch="arm64" ;; \
        *) echo "Unsupported architecture: $arch" >&2; exit 1 ;; \
    esac; \
    curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${node_arch}.tar.gz" -o /tmp/node.tar.gz; \
    tar -xzf /tmp/node.tar.gz -C /usr/local --strip-components=1; \
    rm /tmp/node.tar.gz; \
    node --version; \
    npm --version

# Maven 3.9
RUN set -eux; \
    curl -fsSL "https://archive.apache.org/dist/maven/maven-3/${MAVEN_VERSION}/binaries/apache-maven-${MAVEN_VERSION}-bin.tar.gz" -o /tmp/maven.tar.gz; \
    mkdir -p "${MAVEN_HOME}"; \
    tar -xzf /tmp/maven.tar.gz -C "${MAVEN_HOME}" --strip-components=1; \
    rm /tmp/maven.tar.gz; \
    mvn --version

# Cài sẵn plugin để không phải click tay sau khi khởi động.
COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt

USER jenkins
