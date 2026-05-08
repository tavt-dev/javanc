package com.javanc.profile.client;

import com.javanc.profile.dto.ApiResponse;
import com.javanc.profile.dto.ImageDTO;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;
import org.jboss.resteasy.reactive.PartType;
import org.jboss.resteasy.reactive.RestForm;

import java.io.File;

@Path("/image")
@RegisterRestClient(configKey = "image-service")
@Produces(MediaType.APPLICATION_JSON)
public interface ImageClient {

    @POST
    @Path("/save")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    ApiResponse<ImageDTO> save(@RestForm("image") @PartType(MediaType.APPLICATION_OCTET_STREAM) File image);

    @GET
    @Path("/getAll")
    ApiResponse<String> getAll();
}
