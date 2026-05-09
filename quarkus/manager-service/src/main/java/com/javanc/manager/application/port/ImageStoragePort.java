package com.javanc.manager.application.port;

import org.jboss.resteasy.reactive.multipart.FileUpload;

public interface ImageStoragePort {
    String uploadCompanyImage(FileUpload imageFile);
}
