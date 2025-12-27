package com.fourpm.daft_importer.service;

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.function.BiFunction;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.fourpm.daft.wsclient.*;
import com.fourpm.daft_importer.model.ImageMedia;
import com.fourpm.daft_importer.model.DocumentMedia;

/**
 * Service class for interacting with the Daft SOAP API.
 * Provides methods to fetch and filter property listings of various types,
 * including associated images and documents for each property.
 */
@Service
public class DaftService {
    private static final long RATE_LIMIT_DELAY = 250;

    /**
     * Handles rate limiting by pausing execution for a fixed delay.
     * This helps to avoid exceeding the API's request limits.
     */
    private void handleRateLimit() {
        try {
            Thread.sleep(RATE_LIMIT_DELAY);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Rate limiting interrupted", e);
        }
    }

    /**
     * Fetches all pages of results from the Daft API for a given property type.
     * @param apiKey The API key for authentication.
     * @param fetcher A function that fetches a page of results.
     * @param <T> The type of property ad.
     * @return List of all property ads of type T.
     */
    private <T> List<T> fetchAllPages(String apiKey, BiFunction<String, SearchQuery, ? extends PaginatedResult<T>> fetcher) {
        List<T> results = new ArrayList<>();
        SearchQuery query = createBaseSearchQuery();
        int currentPage = 0;
        boolean completed = false;

        try {
            do {
                query.setPage(BigInteger.valueOf(++currentPage));
                PaginatedResult<T> response = fetcher.apply(apiKey, query);
                results.addAll(response.getAds());

                Pagination pagination = response.getPagination();
                completed = pagination.getNumPages().intValue() == 0 ||
                        pagination.getCurrentPage().intValue() >= pagination.getNumPages().intValue();
                handleRateLimit();
            } while (!completed);
            return results;
        } catch (Exception e) {
            throw new RuntimeException("Error fetching data from Daft API: " + e.getMessage(), e);
        }
    }

    /**
     * Creates a base SearchQuery with default parameters.
     * @return SearchQuery with default settings.
     */
    private SearchQuery createBaseSearchQuery() {
        SearchQuery query = new SearchQuery();
        query.setAgreed(BigInteger.valueOf(2));
        query.setSortBy("date");
        return query;
    }

    /**
     * Adapts SaleResults to a PaginatedResult of SaleAd.
     */
    private PaginatedResult<SaleAd> adaptSaleResults(SaleResults results) {
        return new PaginatedResultAdapter<>(results.getAds(), results.getPagination());
    }

    /**
     * Adapts CommercialResults to a PaginatedResult of CommercialAd.
     */
    private PaginatedResult<CommercialAd> adaptCommercialResults(CommercialResults results) {
        return new PaginatedResultAdapter<>(results.getAds(), results.getPagination());
    }

    /**
     * Adapts NewDevelopmentResults to a PaginatedResult of NewDevelopmentAd.
     */
    private PaginatedResult<NewDevelopmentAd> adaptNewDevelopmentResults(NewDevelopmentResults results) {
        return new PaginatedResultAdapter<>(results.getAds(), results.getPagination());
    }

    /**
     * Adapts RentalResults to a PaginatedResult of RentalAd.
     */
    private PaginatedResult<RentalAd> adaptRentalResults(RentalResults results) {
        return new PaginatedResultAdapter<>(results.getAds(), results.getPagination());
    }

    /**
     * Adapts ShorttermResults to a PaginatedResult of ShorttermAd.
     */
    private PaginatedResult<ShorttermAd> adaptShorttermResults(ShorttermResults results) {
        return new PaginatedResultAdapter<>(results.getAds(), results.getPagination());
    }

    /**
     * Adapter class to wrap ads and pagination into a PaginatedResult.
     * @param <T> The type of property ad.
     */
    private static class PaginatedResultAdapter<T> implements PaginatedResult<T> {
        private final List<T> ads;
        private final Pagination pagination;

        public PaginatedResultAdapter(List<T> ads, Pagination pagination) {
            this.ads = ads;
            this.pagination = pagination;
        }

        @Override
        public List<T> getAds() {
            return ads;
        }

        @Override
        public Pagination getPagination() {
            return pagination;
        }
    }

    /**
     * Gets all images for a given ad using the Daft SOAP API media method.
     * @param adType The ad type (e.g., "sale").
     * @param adId The ad ID.
     * @param apiKey The API key.
     * @return List of ImageMedia objects.
     */
    public List<ImageMedia> getImagesForAd(String adType, Long adId, String apiKey) {
        DaftAPIService_Service service = new DaftAPIService_Service();
        DaftAPIService api = service.getDaftAPIService();

        com.fourpm.daft.wsclient.MediaType1 mediaType = api.media(apiKey, adType, BigInteger.valueOf(adId));
        if (mediaType == null || mediaType.getImages() == null) {
            return Collections.emptyList();
        }

        return mediaType.getImages().stream()
            .map(img -> new ImageMedia(
                img.getCaption(),
                img.getLargeUrl(),
                img.getMediumUrl(),
                img.getSmallUrl(),
                img.getIphoneUrl(),
                img.getIpadSearchUrl(),
                img.getIpadGalleryUrl(),
                null
            ))
            .filter(img -> img.getLargeUrl() != null)
            .distinct()
            .collect(Collectors.toMap(
                ImageMedia::getLargeUrl,
                img -> img,
                (img1, img2) -> img1
            ))
            .values()
            .stream()
            .collect(Collectors.toList());
    }

    /**
     * Gets all documents for a given ad using the Daft SOAP API media method.
     * @param adType The ad type (e.g., "sale").
     * @param adId The ad ID.
     * @param apiKey The API key.
     * @return List of DocumentMedia objects.
     */
    public List<DocumentMedia> getDocumentsForAd(String adType, Long adId, String apiKey) {
        DaftAPIService_Service service = new DaftAPIService_Service();
        DaftAPIService api = service.getDaftAPIService();

        com.fourpm.daft.wsclient.MediaType1 mediaType = api.media(apiKey, adType, BigInteger.valueOf(adId));
        if (mediaType == null || mediaType.getDocuments() == null) {
            return Collections.emptyList();
        }

        return mediaType.getDocuments().stream()
            .map(doc -> new DocumentMedia(doc.getCaption(), doc.getUrl()))
            .filter(doc -> doc.getUrl() != null)
            .distinct()
            .collect(Collectors.toList());
    }

    /**
     * Retrieves all sale ads, including their images and documents.
     * @param apiKey The API key for authentication.
     * @return PropertyListResult containing a list of SaleAdWithMedia.
     */
    public PropertyListResult getPropertyList(String apiKey) {
        PropertyListResult result = new PropertyListResult();

        result.setSales(
            fetchAllPages(apiKey, (key, query) -> adaptSaleResults(new DaftAPIService_Service().getDaftAPIService().searchSale(key, query)))
                .stream()
                .map(saleAd -> new SaleAdWithImages(
                    saleAd,
                    getImagesForAd("sale", saleAd.getAdId().longValue(), apiKey)
                ))
                .collect(Collectors.toList())
        );

        return result;
    }

    /**
     * Retrieves a sale ad by its ID, including images and documents.
     * @param id The property ID.
     * @param apiKey The API key for authentication.
     * @return Optional containing SaleAdWithMedia if found, or empty if not.
     */
    public Optional<SaleAdWithMedia> getPropertyByIdWithMedia(Long id, String apiKey) {
        DaftAPIService_Service service = new DaftAPIService_Service();
        DaftAPIService api = service.getDaftAPIService();
        List<SaleAd> saleAds = fetchAllPages(apiKey, (key, query) -> adaptSaleResults(api.searchSale(key, query)));

        return saleAds.stream()
                .filter(saleAd -> saleAd.getAdId().longValue() == id)
                .findFirst()
                .map(saleAd -> new SaleAdWithMedia(
                        saleAd,
                        getImagesForAd("sale", saleAd.getAdId().longValue(), apiKey),
                        getDocumentsForAd("sale", saleAd.getAdId().longValue(), apiKey)
                ));
    }

    /**
     * Retrieves a list of sale ads within a price range, including images and documents.
     * @param minPrice The minimum price.
     * @param maxPrice The maximum price.
     * @param apiKey The API key for authentication.
     * @return List of SaleAdWithMedia within the specified price range.
     */
    public List<SaleAdWithMedia> getPropertiesByPriceRangeWithMedia(Double minPrice, Double maxPrice, String apiKey) {
        DaftAPIService_Service service = new DaftAPIService_Service();
        DaftAPIService api = service.getDaftAPIService();
        List<SaleAd> saleAds = fetchAllPages(apiKey, (key, query) -> adaptSaleResults(api.searchSale(key, query)));

        return saleAds.stream()
                .filter(saleAd -> saleAd.getPrice() != null
                        && saleAd.getPrice().doubleValue() >= minPrice
                        && saleAd.getPrice().doubleValue() <= maxPrice)
                .map(saleAd -> new SaleAdWithMedia(
                        saleAd,
                        getImagesForAd("sale", saleAd.getAdId().longValue(), apiKey),
                        getDocumentsForAd("sale", saleAd.getAdId().longValue(), apiKey)
                ))
                .collect(Collectors.toList());
    }

    /**
     * Retrieves a list of sale ads by property type, including images and documents.
     * @param type The property type (e.g., "house", "apartment").
     * @param apiKey The API key for authentication.
     * @return List of SaleAdWithMedia matching the given type.
     */
    public List<SaleAdWithMedia> getPropertiesByTypeWithMedia(String type, String apiKey) {
        DaftAPIService_Service service = new DaftAPIService_Service();
        DaftAPIService api = service.getDaftAPIService();
        List<SaleAd> saleAds = fetchAllPages(apiKey, (key, query) -> adaptSaleResults(api.searchSale(key, query)));

        return saleAds.stream()
                .filter(saleAd -> saleAd.getPropertyType().equalsIgnoreCase(type))
                .map(saleAd -> new SaleAdWithMedia(
                        saleAd,
                        getImagesForAd("sale", saleAd.getAdId().longValue(), apiKey),
                        getDocumentsForAd("sale", saleAd.getAdId().longValue(), apiKey)
                ))
                .collect(Collectors.toList());
    }
}