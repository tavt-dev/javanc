package com.javanc.manager.interfaces.rest.resource;

import com.javanc.manager.application.dto.ApiResponse;
import com.javanc.manager.application.dto.JobDTO;
import com.javanc.manager.application.service.JobApplicationService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;

import java.util.List;

@Path("/manager")
@Produces(MediaType.APPLICATION_JSON)
public class JobResource {

    private final JobApplicationService jobService;

    @Inject
    public JobResource(JobApplicationService jobService) {
        this.jobService = jobService;
    }

    @POST
    @Path("/hr/job/create")
    @Consumes(MediaType.APPLICATION_JSON)
    public ApiResponse<JobDTO> create(JobDTO job) {
        return new ApiResponse<>(true, "Job created", jobService.create(job));
    }

    @POST
    @Path("/hr/job/update")
    @Consumes(MediaType.APPLICATION_JSON)
    public ApiResponse<JobDTO> update(JobDTO job) {
        return new ApiResponse<>(true, "Job updated", jobService.update(job));
    }

    @POST
    @Path("/hr/job/delete")
    public ApiResponse<String> delete(@QueryParam("id") Integer id) {
        jobService.delete(id);
        return new ApiResponse<>(true, "Job deleted", "Ok");
    }

    @PUT
    @Path("/user/job/apply")
    public ApiResponse<JobDTO> apply(@QueryParam("jobDTO") Integer jobDTO, @QueryParam("idProfile") Integer idProfile) {
        return new ApiResponse<>(true, "Job applied", jobService.applyJob(jobDTO, idProfile));
    }

    @POST
    @Path("/user/jobs/{id}/applications")
    public ApiResponse<JobDTO> applyCurrentUser(@PathParam("id") Integer id) {
        return new ApiResponse<>(true, "Job applied", jobService.applyCurrentUser(id));
    }

    @POST
    @Path("/user/jobs/{id}/leave")
    public ApiResponse<JobDTO> leaveCurrentUser(@PathParam("id") Integer id) {
        return new ApiResponse<>(true, "Job left", jobService.leaveCurrentUser(id));
    }

    @GET
    @Path("/user/jobs/{id}/application-status")
    public ApiResponse<String> applicationStatus(@PathParam("id") Integer id) {
        return new ApiResponse<>(true, "Application status found", jobService.applicationStatus(id));
    }

    @PUT
    @Path("/hr/job/accept")
    public ApiResponse<JobDTO> accept(@QueryParam("jobDTO") Integer jobDTO, @QueryParam("idProfile") Integer idProfile) {
        return new ApiResponse<>(true, "Job accepted", jobService.acceptProfile(jobDTO, idProfile));
    }

    @PUT
    @Path("/hr/job/reject")
    public ApiResponse<JobDTO> reject(@QueryParam("jobDTO") Integer jobDTO, @QueryParam("idProfile") Integer idProfile) {
        return new ApiResponse<>(true, "Job rejected", jobService.rejectProfile(jobDTO, idProfile));
    }

    @GET
    @Path("/user/job/findbyid")
    public ApiResponse<JobDTO> getById(@QueryParam("id") Integer id) {
        return new ApiResponse<>(true, "Job found", jobService.findById(id));
    }

    @GET
    @Path("/user/job/getall")
    public ApiResponse<List<JobDTO>> getAll(@QueryParam("query") String query, @QueryParam("page") Integer page,
            @QueryParam("size") Integer size, @QueryParam("sort") String sort) {
        return new ApiResponse<>(true, "Jobs found", jobService.getAllJobs(query, page, size, sort));
    }

    @GET
    @Path("/user/job/getjobbycompany")
    public ApiResponse<List<JobDTO>> getJobByCompany(@QueryParam("id") Integer id, @QueryParam("query") String query,
            @QueryParam("page") Integer page, @QueryParam("size") Integer size, @QueryParam("sort") String sort) {
        return new ApiResponse<>(true, "Jobs found", jobService.getJobByCompany(id, query, page, size, sort));
    }

    @GET
    @Path("/user/job/getjobpending")
    public ApiResponse<List<JobDTO>> getJobPending(@QueryParam("id") Integer id) {
        return new ApiResponse<>(true, "Jobs pending found", jobService.getJobByPrfilePending(id));
    }

    @GET
    @Path("/user/job/getjobaccepted")
    public ApiResponse<List<JobDTO>> getJobAccepted(@QueryParam("id") Integer id) {
        return new ApiResponse<>(true, "Jobs accepted found", jobService.getJobByProfileAccepted(id));
    }

    @GET
    @Path("/user/job/getnewjob")
    public ApiResponse<List<JobDTO>> getNewJob(@QueryParam("id") Integer id) {
        return new ApiResponse<>(true, "New jobs found", jobService.getNewJob(id));
    }
}
