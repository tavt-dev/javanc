package com.javanc.project.application.port;

import com.javanc.project.application.dto.ImageDTO;
import org.jboss.resteasy.reactive.multipart.FileUpload;

public interface ImageStoragePort {

    ImageDTO save(FileUpload image);

    String getAll();
}
