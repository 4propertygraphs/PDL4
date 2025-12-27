package com.fourpm.daft_importer.service;

import com.fourpm.daft.wsclient.SaleAd;
import com.fourpm.daft_importer.model.ImageMedia;
import com.fourpm.daft_importer.model.DocumentMedia;
import java.util.List;

public class SaleAdWithMedia {
    private SaleAd saleAd;
    private List<ImageMedia> images;
    private List<DocumentMedia> documents;

    public SaleAdWithMedia(SaleAd saleAd, List<ImageMedia> images, List<DocumentMedia> documents) {
        this.saleAd = saleAd;
        this.images = images;
        this.documents = documents;
    }

    public SaleAd getSaleAd() { return saleAd; }
    public void setSaleAd(SaleAd saleAd) { this.saleAd = saleAd; }
    public List<ImageMedia> getImages() { return images; }
    public void setImages(List<ImageMedia> images) { this.images = images; }
    public List<DocumentMedia> getDocuments() { return documents; }
    public void setDocuments(List<DocumentMedia> documents) { this.documents = documents; }
}