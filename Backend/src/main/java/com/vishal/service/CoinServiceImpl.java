package com.vishal.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vishal.model.Coin;
import com.vishal.repository.CoinRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;


import java.util.List;
import java.util.Optional;

@Service
public class CoinServiceImpl implements CoinService{
    @Autowired
    private CoinRepository coinRepository;

    @Autowired
    private ObjectMapper objectMapper;


    @Value("${coingecko.api.key}")
    private String API_KEY;



    @Override
    public List<Coin> getCoinList(int page) throws Exception {
        String url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=10&page="+page;


        RestTemplate restTemplate = new RestTemplate();
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("x-cg-demo-api-key", API_KEY);


            HttpEntity<String> entity = new HttpEntity<>("parameters", headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            System.out.println(response.getBody());
            List<Coin> coins = objectMapper.readValue(response.getBody(), new TypeReference<List<Coin>>() {});

            return coins;

        } catch (HttpClientErrorException | HttpServerErrorException | JsonProcessingException e) {
            System.err.println("Error: " + e);
            // Handle error accordingly
            throw new RuntimeException("Please wait a moment, the market data provider is rate limiting us (free plan).");
        }

    }

    @Override
    public String getMarketChart(String coinId, int days) throws Exception {
        String url = "https://api.coingecko.com/api/v3/coins/"+coinId+"/market_chart?vs_currency=usd&days="+days;

        RestTemplate restTemplate = new RestTemplate();
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("x-cg-demo-api-key", API_KEY);

            HttpEntity<String> entity = new HttpEntity<>("parameters", headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            return response.getBody();

        } catch (HttpClientErrorException | HttpServerErrorException e) {
            System.err.println("Error: " + e);
            // Handle error accordingly
//            return null;
            throw new RuntimeException("Rate limit reached for market data. Please try again in a minute.");
        }

    }

    private double convertToDouble(Object value) {
        if (value instanceof Integer) {
            return ((Integer) value).doubleValue();
        } else if (value instanceof Long) {
            return ((Long) value).doubleValue();
        } else if (value instanceof Double) {
            return (Double) value;
        } else {
            throw new IllegalArgumentException("Unsupported data type: " + value.getClass().getName());
        }
    }

    @Override
    public String getCoinDetails(String coinId) throws JsonProcessingException {
        return fetchAndSaveCoinFromCoinGecko(coinId).rawResponseBody;
    }

    // BUGFIX: findById previously only ever checked the local `coins` table, which
    // starts empty and is only ever populated as a side effect of getCoinDetails()
    // being called for that specific coin. Since nothing in the buy/sell flow calls
    // getCoinDetails() first, EVERY order for a coin that had never individually been
    // "detail-fetched" failed with "invalid coin id" - in practice this meant almost
    // every order placed straight from the Markets list failed. findById now falls
    // back to fetching the coin from CoinGecko (and persisting it, same as
    // getCoinDetails already did) when it isn't found locally yet, so any valid
    // CoinGecko coin id can be bought/sold on the first try.
    @Override
    public Coin findById(String coinId) throws Exception {
        Optional<Coin> optionalCoin = coinRepository.findById(coinId);
        if (optionalCoin.isPresent()) {
            return optionalCoin.get();
        }
        try {
            fetchAndSaveCoinFromCoinGecko(coinId);
        } catch (HttpClientErrorException | HttpServerErrorException | JsonProcessingException e) {
            throw new RuntimeException("invalid coin id");
        }
        Optional<Coin> refetched = coinRepository.findById(coinId);
        if (refetched.isEmpty()) throw new RuntimeException("invalid coin id");
        return refetched.get();
    }

    /** Bundles the raw CoinGecko response body alongside the parsed+saved Coin, so
     *  getCoinDetails can keep returning the exact original response string. */
    private static class CoinFetchResult {
        final String rawResponseBody;
        CoinFetchResult(String rawResponseBody) { this.rawResponseBody = rawResponseBody; }
    }

    /**
     * Fetches a single coin's full detail payload from CoinGecko, maps it onto a
     * {@link Coin} entity, and upserts it into the local `coins` table.
     */
    private CoinFetchResult fetchAndSaveCoinFromCoinGecko(String coinId) throws JsonProcessingException {
        String baseUrl = "https://api.coingecko.com/api/v3/coins/" + coinId;

        HttpHeaders headers = new HttpHeaders();
        headers.set("x-cg-demo-api-key", API_KEY);

        HttpEntity<String> entity = new HttpEntity<>(headers);

        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<String> response = restTemplate.exchange(baseUrl, HttpMethod.GET, entity, String.class);

        JsonNode jsonNode = objectMapper.readTree(response.getBody());

        Coin coin = new Coin();

        coin.setId(jsonNode.get("id").asText());
        coin.setSymbol(jsonNode.get("symbol").asText());
        coin.setName(jsonNode.get("name").asText());
        coin.setImage(jsonNode.get("image").get("large").asText());

        JsonNode marketData = jsonNode.get("market_data");

        coin.setCurrentPrice(marketData.get("current_price").get("usd").asDouble());
        coin.setMarketCap(marketData.get("market_cap").get("usd").asLong());
        coin.setMarketCapRank(jsonNode.get("market_cap_rank").asInt());
        coin.setTotalVolume(marketData.get("total_volume").get("usd").asLong());
        coin.setHigh24h(marketData.get("high_24h").get("usd").asDouble());
        coin.setLow24h(marketData.get("low_24h").get("usd").asDouble());
        coin.setPriceChange24h(marketData.get("price_change_24h").asDouble());
        coin.setPriceChangePercentage24h(marketData.get("price_change_percentage_24h").asDouble());
        coin.setMarketCapChange24h(marketData.get("market_cap_change_24h").asLong());
        coin.setMarketCapChangePercentage24h(marketData.get("market_cap_change_percentage_24h").asDouble());
        coin.setCirculatingSupply(marketData.get("circulating_supply").asLong());
        coin.setTotalSupply(marketData.get("total_supply").asLong());

        coinRepository.save(coin);
        return new CoinFetchResult(response.getBody());
    }

    @Override
    public String searchCoin(String keyword) {
        String baseUrl ="https://api.coingecko.com/api/v3/search?query="+keyword;

        HttpHeaders headers = new HttpHeaders();
        headers.set("x-cg-demo-api-key", API_KEY);

        HttpEntity<String> entity = new HttpEntity<>(headers);


        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<String> response = restTemplate.exchange(baseUrl, HttpMethod.GET, entity, String.class);

        System.out.println(response.getBody());

        return response.getBody();
    }

    @Override
    public String getTop50CoinsByMarketCapRank() {
        String url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&page=1&per_page=50";

        RestTemplate restTemplate = new RestTemplate();
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("x-cg-demo-api-key", API_KEY);

            HttpEntity<String> entity = new HttpEntity<>("parameters", headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            return response.getBody();

        } catch (HttpClientErrorException | HttpServerErrorException e) {
            System.err.println("Error: " + e);
            // Handle error accordingly
            return null;
        }

    }

    @Override
    public String getTradingCoins() {
        String url = "https://api.coingecko.com/api/v3/search/trending";

        RestTemplate restTemplate = new RestTemplate();
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("x-cg-demo-api-key", API_KEY);

            HttpEntity<String> entity = new HttpEntity<>("parameters", headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            return response.getBody();

        } catch (HttpClientErrorException | HttpServerErrorException e) {
            System.err.println("Error: " + e);
            // Handle error accordingly
            return null;
        }
    }
}
