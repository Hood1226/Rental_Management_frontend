package com.company.project.service;

import com.company.project.dto.RolePermissionDTO;
import com.company.project.entity.Module;
import com.company.project.entity.Role;
import com.company.project.entity.RolePermission;
import com.company.project.repository.ModuleRepository;
import com.company.project.repository.RolePermissionRepository;
import com.company.project.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RolePermissionService {

    private final RolePermissionRepository rolePermissionRepository;
    private final RoleRepository roleRepository;
    private final ModuleRepository moduleRepository;

    public List<RolePermissionDTO> getPermissionsByRoleId(Long roleId) {
        return rolePermissionRepository.findByRoleId(roleId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public RolePermissionDTO updatePermission(Long roleId, RolePermissionDTO permissionDTO) {
        RolePermission permission = rolePermissionRepository.findByRoleIdAndModuleId(roleId, permissionDTO.getModuleId())
                .orElseGet(() -> {
                    Role role = roleRepository.findById(roleId)
                            .orElseThrow(() -> new RuntimeException("Role not found"));
                    Module module = moduleRepository.findById(permissionDTO.getModuleId())
                            .orElseThrow(() -> new RuntimeException("Module not found"));
                    
                    return RolePermission.builder()
                            .role(role)
                            .module(module)
                            .build();
                });

        permission.setCanCreate(permissionDTO.isCanCreate());
        permission.setCanRead(permissionDTO.isCanRead());
        permission.setCanUpdate(permissionDTO.isCanUpdate());
        permission.setCanDelete(permissionDTO.isCanDelete());

        return convertToDTO(rolePermissionRepository.save(permission));
    }

    private RolePermissionDTO convertToDTO(RolePermission permission) {
        RolePermissionDTO dto = new RolePermissionDTO();
        dto.setId(permission.getId());
        dto.setRoleId(permission.getRole().getId());
        dto.setModuleId(permission.getModule().getId());
        dto.setModuleName(permission.getModule().getModuleName());
        dto.setModuleKey(permission.getModule().getModuleKey());
        dto.setCanCreate(permission.isCanCreate());
        dto.setCanRead(permission.isCanRead());
        dto.setCanUpdate(permission.isCanUpdate());
        dto.setCanDelete(permission.isCanDelete());
        return dto;
    }
}
