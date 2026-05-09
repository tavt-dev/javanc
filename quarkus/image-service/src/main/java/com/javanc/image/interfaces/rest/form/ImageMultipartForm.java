package com.javanc.image.interfaces.rest.form;

import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

public class ImageMultipartForm {

    @RestForm("image")
    private FileUpload image;

    public FileUpload getImage() {
        return image;
    }

    public void setImage(FileUpload image) {
        this.image = image;
    }
}
