package com.javanc.image.application.port;

public record ImageUploadResult(
        String url,
        String publicId,
        String secureUrl,
        String format,
        String resourceType,
        Long bytes,
        Integer width,
        Integer height) {
}
