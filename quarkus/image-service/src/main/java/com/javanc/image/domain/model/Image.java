package com.javanc.image.domain.model;

import java.time.Instant;

public class Image {

    private Integer id;
    private String url;
    private String publicId;
    private String secureUrl;
    private String format;
    private String resourceType;
    private Long bytes;
    private Integer width;
    private Integer height;
    private Instant createdAt;

    public Image() {
    }

    public Image(Integer id, String url) {
        this.id = id;
        this.url = url;
    }

    public Image(Integer id, String url, String publicId, String secureUrl, String format, String resourceType,
            Long bytes, Integer width, Integer height, Instant createdAt) {
        this.id = id;
        this.url = url;
        this.publicId = publicId;
        this.secureUrl = secureUrl;
        this.format = format;
        this.resourceType = resourceType;
        this.bytes = bytes;
        this.width = width;
        this.height = height;
        this.createdAt = createdAt;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getPublicId() {
        return publicId;
    }

    public void setPublicId(String publicId) {
        this.publicId = publicId;
    }

    public String getSecureUrl() {
        return secureUrl;
    }

    public void setSecureUrl(String secureUrl) {
        this.secureUrl = secureUrl;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public Long getBytes() {
        return bytes;
    }

    public void setBytes(Long bytes) {
        this.bytes = bytes;
    }

    public Integer getWidth() {
        return width;
    }

    public void setWidth(Integer width) {
        this.width = width;
    }

    public Integer getHeight() {
        return height;
    }

    public void setHeight(Integer height) {
        this.height = height;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
