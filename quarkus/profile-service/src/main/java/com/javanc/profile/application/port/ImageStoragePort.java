package com.javanc.profile.application.port;

import org.jboss.resteasy.reactive.multipart.FileUpload;

public interface ImageStoragePort {

    String uploadForSave(FileUpload imageFile);

    String uploadForUpdate(FileUpload imageFile);
}
