package com.javanc.manager.application.dto;

public class CreateHrPromotionRequest {
    public Integer targetUserId;
    public Integer companyId;
    public String companyName;

    public CreateHrPromotionRequest() {
    }

    public CreateHrPromotionRequest(Integer targetUserId, Integer companyId, String companyName) {
        this.targetUserId = targetUserId;
        this.companyId = companyId;
        this.companyName = companyName;
    }
}
