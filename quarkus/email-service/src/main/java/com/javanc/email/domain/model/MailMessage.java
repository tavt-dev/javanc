package com.javanc.email.domain.model;

public class MailMessage {

    private final String mailFrom;
    private final String mailTo;
    private final String mailSubject;
    private final String mailContent;
    private final String contentType;

    public MailMessage(String mailFrom, String mailTo, String mailSubject, String mailContent, String contentType) {
        this.mailFrom = mailFrom;
        this.mailTo = mailTo;
        this.mailSubject = mailSubject;
        this.mailContent = mailContent;
        this.contentType = contentType;
    }

    public String getMailFrom() {
        return mailFrom;
    }

    public String getMailTo() {
        return mailTo;
    }

    public String getMailSubject() {
        return mailSubject;
    }

    public String getMailContent() {
        return mailContent;
    }

    public String getContentType() {
        return contentType;
    }
}
