package com.fourpm.daft_importer.model;

public class DocumentMedia {
    private String caption;
    private String url;

    public DocumentMedia(String caption, String url) {
        this.caption = caption;
        this.url = url;
    }

    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
}
