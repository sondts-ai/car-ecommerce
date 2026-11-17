package vn.carsales.auth.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "roles")
public class Role {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "TINYINT UNSIGNED")
    private Short id;
    @Column(nullable = false, unique = true, length = 30)
    private String name;
    public Short getId() { return id; }
    public String getName() { return name; }
}
