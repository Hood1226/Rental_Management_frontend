package com.company.project.service;

import com.company.project.dto.ModuleDTO;
import com.company.project.entity.Module;
import com.company.project.repository.ModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ModuleService {

    private final ModuleRepository moduleRepository;

    public List<ModuleDTO> getAllModules() {
        return moduleRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ModuleDTO getModuleById(Long id) {
        Module module = moduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Module not found"));
        return convertToDTO(module);
    }

    @Transactional
    public ModuleDTO createModule(ModuleDTO moduleDTO) {
        if (moduleRepository.findByModuleKey(moduleDTO.getModuleKey()).isPresent()) {
            throw new RuntimeException("Module key already exists");
        }

        Module module = Module.builder()
                .moduleName(moduleDTO.getModuleName())
                .moduleKey(moduleDTO.getModuleKey())
                .displayOrder(moduleDTO.getDisplayOrder())
                .build();

        return convertToDTO(moduleRepository.save(module));
    }

    @Transactional
    public ModuleDTO updateModule(Long id, ModuleDTO moduleDTO) {
        Module module = moduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Module not found"));

        module.setModuleName(moduleDTO.getModuleName());
        module.setModuleKey(moduleDTO.getModuleKey());
        module.setDisplayOrder(moduleDTO.getDisplayOrder());

        return convertToDTO(moduleRepository.save(module));
    }

    @Transactional
    public void deleteModule(Long id) {
        moduleRepository.deleteById(id);
    }

    private ModuleDTO convertToDTO(Module module) {
        ModuleDTO dto = new ModuleDTO();
        dto.setId(module.getId());
        dto.setModuleName(module.getModuleName());
        dto.setModuleKey(module.getModuleKey());
        dto.setDisplayOrder(module.getDisplayOrder());
        return dto;
    }
}
