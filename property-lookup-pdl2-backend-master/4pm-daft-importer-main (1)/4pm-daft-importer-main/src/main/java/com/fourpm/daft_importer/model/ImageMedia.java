package com.fourpm.daft_importer.model;

public class ImageMedia {

    private String caption;
    private String largeUrl;
    private String mediumUrl;
    private String smallUrl;
    private String iphoneUrl;
    private String ipadSearchUrl;
    private String ipadGalleryUrl;
    private String ipadUrl;

    // Constructor
    public ImageMedia(String caption, String largeUrl, String mediumUrl, String smallUrl,
                      String iphoneUrl, String ipadSearchUrl, String ipadGalleryUrl, String ipadUrl) {
        this.caption = caption;
        this.largeUrl = largeUrl;
        this.mediumUrl = mediumUrl;
        this.smallUrl = smallUrl;
        this.iphoneUrl = iphoneUrl;
        this.ipadSearchUrl = ipadSearchUrl;
        this.ipadGalleryUrl = ipadGalleryUrl;
        this.ipadUrl = ipadUrl;
    }

    // Getters and setters
    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }
    public String getLargeUrl() { return largeUrl; }
    public void setLargeUrl(String largeUrl) { this.largeUrl = largeUrl; }
    public String getMediumUrl() { return mediumUrl; }
    public void setMediumUrl(String mediumUrl) { this.mediumUrl = mediumUrl; }
    public String getSmallUrl() { return smallUrl; }
    public void setSmallUrl(String smallUrl) { this.smallUrl = smallUrl; }
    public String getIphoneUrl() { return iphoneUrl; }
    public void setIphoneUrl(String iphoneUrl) { this.iphoneUrl = iphoneUrl; }
    public String getIpadSearchUrl() { return ipadSearchUrl; }
    public void setIpadSearchUrl(String ipadSearchUrl) { this.ipadSearchUrl = ipadSearchUrl; }
    public String getIpadGalleryUrl() { return ipadGalleryUrl; }
    public void setIpadGalleryUrl(String ipadGalleryUrl) { this.ipadGalleryUrl = ipadGalleryUrl; }
    public String getIpadUrl() { return ipadUrl; }
    public void setIpadUrl(String ipadUrl) { this.ipadUrl = ipadUrl; }

    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        ImageMedia that = (ImageMedia) o;

        // Considera dos objetos iguales si tienen la misma largeUrl (puedes ajustar si lo deseas)
        return largeUrl != null ? largeUrl.equals(that.largeUrl) : that.largeUrl == null;
    }

    @Override
    public int hashCode() {
        return largeUrl != null ? largeUrl.hashCode() : 0;
    }


}