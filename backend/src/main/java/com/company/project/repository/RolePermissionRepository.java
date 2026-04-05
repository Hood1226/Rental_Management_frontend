package com.company.project.repository;

import com.company.project.entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {
    List<RolePermission> findByRoleId(Long roleId);
    Optional<RolePermission> findByRoleIdAndModuleId(Long roleId, Long moduleId);
    Optional<RolePermission> findByRoleIdAndModuleModuleKey(Long roleId, String moduleKey);
}
