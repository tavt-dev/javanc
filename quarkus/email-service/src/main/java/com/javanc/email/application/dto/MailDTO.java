package com.javanc.email.application.dto;

public class MailDTO {

    private String mailTo;
    private String mailSubject;
    private String mailContent;

    public MailDTO() {
    }

    public MailDTO(String mailTo, String mailSubject, String mailContent) {
        this.mailTo = mailTo;
        this.mailSubject = mailSubject;
        this.mailContent = mailContent;
    }

    public String getMailTo() {
        return mailTo;
    }

    public void setMailTo(String mailTo) {
        this.mailTo = mailTo;
    }

    public String getMailSubject() {
        return mailSubject;
    }

    public void setMailSubject(String mailSubject) {
        this.mailSubject = mailSubject;
    }

    public String getMailContent() {
        return mailContent;
    }

    public void setMailContent(String mailContent) {
        this.mailContent = mailContent;
    }
}
