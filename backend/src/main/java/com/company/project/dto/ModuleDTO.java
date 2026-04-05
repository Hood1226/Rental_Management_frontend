package com.company.project.dto;

import lombok.Data;

@Data
public class ModuleDTO {
    private Long id;
    private String moduleName;
    private String moduleKey;
    private Integer displayOrder;
}
