package com.company.project.service;

import com.company.project.entity.RolePermission;
import com.company.project.entity.User;
import com.company.project.repository.RolePermissionRepository;
import com.company.project.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final RolePermissionRepository rolePermissionRepository;
    private final UserRepository userRepository;

    public boolean hasPermission(String moduleKey, String action) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        String username = authentication.getName();
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return false;
        }

        Long roleId = user.getRole().getId();
        
        return rolePermissionRepository.findByRoleIdAndModuleModuleKey(roleId, moduleKey)
                .map(permission -> {
                    switch (action.toUpperCase()) {
                        case "CREATE": return permission.isCanCreate();
                        case "READ": return permission.isCanRead();
                        case "UPDATE": return permission.isCanUpdate();
                        case "DELETE": return permission.isCanDelete();
                        default: return false;
                    }
                })
                .orElse(false);
    }
}
