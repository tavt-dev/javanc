package com.javanc.profile.dto;

public class ImageDTO {

    private Integer id;
    private String url;

    public ImageDTO() {
    }

    public ImageDTO(Integer id, String url) {
        this.id = id;
        this.url = url;
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
}
