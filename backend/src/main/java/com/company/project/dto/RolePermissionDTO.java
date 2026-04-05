package com.company.project.dto;

import lombok.Data;

@Data
public class RolePermissionDTO {
    private Long id;
    private Long roleId;
    private Long moduleId;
    private String moduleName;
    private String moduleKey;
    private boolean canCreate;
    private boolean canRead;
    private boolean canUpdate;
    private boolean canDelete;
}
