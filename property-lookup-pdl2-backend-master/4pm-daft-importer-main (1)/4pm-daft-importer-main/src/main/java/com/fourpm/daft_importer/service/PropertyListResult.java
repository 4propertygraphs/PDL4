package com.fourpm.daft_importer.service;

import com.fourpm.daft.wsclient.*;
import java.util.ArrayList;
import java.util.List;

public class PropertyListResult {
    
    private List<SaleAdWithImages> sales = new ArrayList<>();
    private List<CommercialAd> commercial = new ArrayList<>();
    private List<NewDevelopmentAd> newDevelopment = new ArrayList<>();
    private List<RentalAd> rental = new ArrayList<>();
    private List<ShorttermAd> shortterm = new ArrayList<>();


    // Getters and setters
    public List<SaleAdWithImages> getSales() { return sales; }
    public void setSales(List<SaleAdWithImages> sales) { this.sales = sales; }
    public List<CommercialAd> getCommercial() { return commercial; }
    public void setCommercial(List<CommercialAd> commercial) { this.commercial = commercial; }
    public List<NewDevelopmentAd> getNewDevelopment() { return newDevelopment; }
    public void setNewDevelopment(List<NewDevelopmentAd> newDevelopment) { this.newDevelopment = newDevelopment; }
    public List<RentalAd> getRental() { return rental; }
    public void setRental(List<RentalAd> rental) { this.rental = rental; }
    public List<ShorttermAd> getShortterm() { return shortterm; }
    public void setShortterm(List<ShorttermAd> shortterm) { this.shortterm = shortterm; }

   
}