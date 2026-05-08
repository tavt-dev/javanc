package com.javanc.profile.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class BooleanDTO {

    @JsonProperty("isCheck")
    private boolean check;

    public BooleanDTO() {
    }

    public BooleanDTO(boolean check) {
        this.check = check;
    }

    @JsonProperty("isCheck")
    public boolean isCheck() {
        return check;
    }

    public void setCheck(boolean check) {
        this.check = check;
    }
}
