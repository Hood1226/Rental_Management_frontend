package com.company.project.controller;

import com.company.project.dto.RolePermissionDTO;
import com.company.project.service.RolePermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleAccessController {

    private final RolePermissionService rolePermissionService;

    @GetMapping("/{roleId}/permissions")
    @PreAuthorize("@permissionService.hasPermission('ROLE_ACCESS_MANAGEMENT', 'READ')")
    public ResponseEntity<List<RolePermissionDTO>> getPermissionsByRole(@PathVariable Long roleId) {
        return ResponseEntity.ok(rolePermissionService.getPermissionsByRoleId(roleId));
    }

    @PutMapping("/{roleId}/permissions")
    @PreAuthorize("@permissionService.hasPermission('ROLE_ACCESS_MANAGEMENT', 'UPDATE')")
    public ResponseEntity<RolePermissionDTO> updatePermission(
            @PathVariable Long roleId,
            @RequestBody RolePermissionDTO permissionDTO) {
        return ResponseEntity.ok(rolePermissionService.updatePermission(roleId, permissionDTO));
    }
}
