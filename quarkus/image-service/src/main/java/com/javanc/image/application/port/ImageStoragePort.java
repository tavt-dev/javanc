package com.javanc.image.application.port;

import org.jboss.resteasy.reactive.multipart.FileUpload;

public interface ImageStoragePort {

    String upload(FileUpload imageFile);
}
