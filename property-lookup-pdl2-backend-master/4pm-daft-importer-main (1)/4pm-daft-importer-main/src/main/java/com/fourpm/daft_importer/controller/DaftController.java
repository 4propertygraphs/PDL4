package com.fourpm.daft_importer.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fourpm.daft_importer.service.DaftService;
import com.fourpm.daft_importer.service.PropertyListResult;
import com.fourpm.daft_importer.service.SaleAdWithMedia;

@RestController
@RequestMapping("/api/daft")
public class DaftController {

    private final DaftService daftService;

    public DaftController(DaftService daftService) {
        this.daftService = daftService;
    }

    @GetMapping("/properties")
    public ResponseEntity<PropertyListResult> getProperties(@RequestParam String apiKey) {
        System.out.println("API call received for /properties with apiKey: " + apiKey);

        if (apiKey == null || apiKey.isEmpty()) {
            System.out.println("Request rejected: Empty or null API key");
            return ResponseEntity.badRequest().build();
        }

        try {
            System.out.println("Calling daftService.getPropertyList with apiKey: " + apiKey);
            PropertyListResult result = daftService.getPropertyList(apiKey);
            System.out.println("Service call successful. Result contains " +
                    (result != null && result.getSales() != null ?
                            result.getRental() : "null") + " properties");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("ERROR in getProperties: " + e.getClass().getName() + ": " + e.getMessage());
            // Print root cause
            Throwable rootCause = e;
            while (rootCause.getCause() != null) {
                rootCause = rootCause.getCause();
                System.err.println("Caused by: " + rootCause.getClass().getName() + ": " + rootCause.getMessage());
            }
            e.printStackTrace();

            // Rethrow to maintain the 500 response
            throw e;
        }
    }

    @GetMapping("/properties/{id}")
    public ResponseEntity<SaleAdWithMedia> getPropertyById(
            @PathVariable Long id,
            @RequestParam String apiKey) {

        if (apiKey == null || apiKey.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        return daftService.getPropertyByIdWithMedia(id, apiKey)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/properties/type")
    public ResponseEntity<List<SaleAdWithMedia>> getPropertiesByType(
            @RequestParam String type,
            @RequestParam String apiKey) {

        if (apiKey == null || apiKey.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        List<SaleAdWithMedia> properties = daftService.getPropertiesByTypeWithMedia(type, apiKey);
        if (properties.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(properties);
    }

    @GetMapping("/properties/price-range")
    public ResponseEntity<List<SaleAdWithMedia>> getPropertiesByPriceRange(
            @RequestParam Double minPrice,
            @RequestParam Double maxPrice,
            @RequestParam String apiKey) {

        if (apiKey == null || apiKey.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        List<SaleAdWithMedia> properties = daftService.getPropertiesByPriceRangeWithMedia(minPrice, maxPrice, apiKey);
        if (properties.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(properties);
    }
}