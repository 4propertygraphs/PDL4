package com.fourpm.daft_importer.service;

import java.util.List;

import com.fourpm.daft.wsclient.SaleAd;
import com.fourpm.daft_importer.model.ImageMedia;

public class SaleAdWithImages {
    private SaleAd saleAd;
    private List<ImageMedia> images;

    public SaleAdWithImages(SaleAd saleAd, List<ImageMedia> images) {
        this.saleAd = saleAd;
        this.images = images;
    }

    public SaleAd getSaleAd() { return saleAd; }
    public void setSaleAd(SaleAd saleAd) { this.saleAd = saleAd; }

    public List<ImageMedia> getImages() { return images; }
    public void setImages(List<ImageMedia> images) { this.images = images; }
}