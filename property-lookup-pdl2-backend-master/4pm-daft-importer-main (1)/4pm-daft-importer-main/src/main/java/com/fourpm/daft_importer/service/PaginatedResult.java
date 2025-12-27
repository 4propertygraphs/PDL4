package com.fourpm.daft_importer.service;

import com.fourpm.daft.wsclient.Pagination;

import java.util.List;

public interface PaginatedResult <T> {
    List<T> getAds();
    Pagination getPagination();
}
