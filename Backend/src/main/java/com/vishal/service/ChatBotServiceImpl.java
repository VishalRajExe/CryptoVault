package com.vishal.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import com.jayway.jsonpath.ReadContext;
import com.vishal.model.Coin;
import com.vishal.model.CoinDTO;
import com.vishal.response.ApiResponse;
import com.vishal.response.FunctionResponse;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Service
public class ChatBotServiceImpl implements ChatBotService{

    @Value("${gemini.api.key}")
    private String API_KEY;

    @Value("${coingecko.api.key}")
    private String COINGECKO_API_KEY;

    // BUGFIX: "gemini-pro" was deprecated/removed by Google and now returns a 404.
    // Centralized here as a constant (previously repeated - and therefore easy to get
    // out of sync - across three separate methods). Google periodically retires model
    // names, so re-check https://ai.google.dev/gemini-api/docs/models if this 404s again.
    private static final String GEMINI_MODEL = "gemini-2.5-flash";

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

    public CoinDTO makeApiRequest(String currencyName) {
        String url = "https://api.coingecko.com/api/v3/coins/"+currencyName.toLowerCase();

        RestTemplate restTemplate = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            // BUGFIX: this request never sent the CoinGecko API key header that
            // CoinServiceImpl uses everywhere else, making the chatbot hit CoinGecko's
            // free-tier rate limits much faster than the rest of the app.
            headers.set("x-cg-demo-api-key", COINGECKO_API_KEY);

            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> responseEntity = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<String, Object> responseBody = responseEntity.getBody();
            if (responseBody != null) {
                Map<String, Object> image = (Map<String, Object>) responseBody.get("image");

                Map<String, Object> marketData = (Map<String, Object>) responseBody.get("market_data");

                CoinDTO coinInfo = new CoinDTO();
                coinInfo.setId((String) responseBody.get("id"));
                coinInfo.setSymbol((String) responseBody.get("symbol"));
                coinInfo.setName((String) responseBody.get("name"));
                coinInfo.setImage((String) image.get("large"));

                coinInfo.setCurrentPrice(convertToDouble(((Map<String, Object>) marketData.get("current_price")).get("usd")));
                coinInfo.setMarketCap(convertToDouble(((Map<String, Object>) marketData.get("market_cap")).get("usd")));
                coinInfo.setMarketCapRank((int) responseBody.get("market_cap_rank"));
                coinInfo.setTotalVolume(convertToDouble(((Map<String, Object>) marketData.get("total_volume")).get("usd")));
                coinInfo.setHigh24h(convertToDouble(((Map<String, Object>) marketData.get("high_24h")).get("usd")));
                coinInfo.setLow24h(convertToDouble(((Map<String, Object>) marketData.get("low_24h")).get("usd")));
                coinInfo.setPriceChange24h(convertToDouble(marketData.get("price_change_24h")) );
                coinInfo.setPriceChangePercentage24h(convertToDouble(marketData.get("price_change_percentage_24h")));
                coinInfo.setMarketCapChange24h(convertToDouble(marketData.get("market_cap_change_24h")));
                coinInfo.setMarketCapChangePercentage24h(convertToDouble( marketData.get("market_cap_change_percentage_24h")));
                coinInfo.setCirculatingSupply(convertToDouble(marketData.get("circulating_supply")));
                coinInfo.setTotalSupply(convertToDouble(marketData.get("total_supply")));

                return coinInfo;

             }
       return null;
    }



    public FunctionResponse getFunctionResponse(String prompt){
        String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/" + GEMINI_MODEL + ":generateContent?key=" + API_KEY;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // BUGFIX: the prompt used to be concatenated directly into a raw JSON string
        // with no escaping at all. JSONObject.quote() properly escapes quotes,
        // backslashes, control characters etc. and returns the value already wrapped
        // in double quotes, so it can safely be substituted as a JSON string literal.
        String escapedPrompt = JSONObject.quote(prompt);

        String requestBody = "{\n" +
                "  \"contents\": [\n" +
                "    {\n" +
                "      \"parts\": [\n" +
                "        {\n" +
                "          \"text\": " + escapedPrompt + "\n" +
                "        }\n" +
                "      ]\n" +
                "    }\n" +
                "  ],\n" +
                "  \"tools\": [\n" +
                "    {\n" +
                "      \"functionDeclarations\": [\n" +
                "        {\n" +
                "          \"name\": \"getCoinDetails\",\n" +
                "          \"description\": \"Get the coin details from given currency object\",\n" +
                "          \"parameters\": {\n" +
                "            \"type\": \"OBJECT\",\n" +
                "            \"properties\": {\n" +
                "              \"currencyName\": {\n" +
                "                \"type\": \"STRING\",\n" +
                "                \"description\": \"The currency name, id, symbol.\"\n" +
                "              },\n" +
                "              \"currencyData\": {\n" +
                "                \"type\": \"STRING\",\n" +
                "                \"description\": \"Currency Data id, symbol, name, image, current_price, market_cap, market_cap_rank, fully_diluted_valuation, total_volume, high_24h, low_24h, price_change_24h, price_change_percentage_24h, market_cap_change_24h, market_cap_change_percentage_24h, circulating_supply, total_supply, max_supply, ath, ath_change_percentage, ath_date, atl, atl_change_percentage, atl_date, last_updated.\"\n" +
                "              }\n" +
                "            },\n" +
                "            \"required\": [\"currencyName\", \"currencyData\"]\n" +
                "          }\n" +
                "        }\n" +
                "      ]\n" +
                "    }\n" +
                "  ]\n" +
                "}";
        // Create the HTTP entity with headers and request body
        HttpEntity<String> requestEntity = new HttpEntity<>(requestBody, headers);

        // Make the POST request
        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<String> response = restTemplate.postForEntity(GEMINI_API_URL, requestEntity, String.class);


        String responseBody = response.getBody();

        ReadContext ctx = JsonPath.parse(responseBody);

        // Extract specific values
        String currencyName = ctx.read("$.candidates[0].content.parts[0].functionCall.args.currencyName");
        String currencyData = ctx.read("$.candidates[0].content.parts[0].functionCall.args.currencyData");
        String name = ctx.read("$.candidates[0].content.parts[0].functionCall.name");

        FunctionResponse res=new FunctionResponse();
        res.setCurrencyName(currencyName);
        res.setCurrencyData(currencyData);
        res.setFunctionName(name);

        return res;
    }




    @Override
    public ApiResponse getCoinDetails(String prompt) {

        FunctionResponse res=getFunctionResponse(prompt);

        CoinDTO coin = makeApiRequest(res.getCurrencyName());
        if (coin == null) {
            // BUGFIX: previously this called .toString() directly on a possibly-null
            // CoinDTO, causing a NullPointerException whenever CoinGecko didn't
            // recognize the requested currency name/id.
            ApiResponse notFound = new ApiResponse();
            notFound.setMessage("Sorry, I couldn't find a cryptocurrency matching \"" + res.getCurrencyName() + "\".");
            return notFound;
        }
        String apiResponse=coin.toString();



         String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/" + GEMINI_MODEL + ":generateContent?key=" + API_KEY;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // BUGFIX: same unescaped-prompt issue as getFunctionResponse() above.
        String escapedPrompt = JSONObject.quote(prompt);


String body="{\n" +
        "  \"contents\": [\n" +
        "    {\n" +
        "      \"role\": \"user\",\n" +
        "      \"parts\": [\n" +
        "        {\n" +
        "          \"text\": " + escapedPrompt + "\n" +
        "        }\n" +
        "      ]\n" +
        "    },\n" +
        "    {\n" +
        "      \"role\": \"model\",\n" +
        "      \"parts\": [\n" +
        "        {\n" +
        "          \"functionCall\": {\n" +
        "            \"name\": \"getCoinDetails\",\n" +
        "            \"args\": {\n" +
        "              \"currencyName\": " + JSONObject.quote(res.getCurrencyName()) + ",\n" +
        "              \"currencyData\": " + JSONObject.quote(res.getCurrencyData()) + "\n" +
        "            }\n" +
        "          }\n" +
        "        }\n" +
        "      ]\n" +
        "    },\n" +
        "    {\n" +
        "      \"role\": \"function\",\n" +
        "      \"parts\": [\n" +
        "        {\n" +
        "          \"functionResponse\": {\n" +
        "            \"name\": \"getCoinDetails\",\n" +
        "            \"response\": {\n" +
        "              \"name\": \"getCoinDetails\",\n" +
        "              \"content\": " + apiResponse + "\n" +
        "            }\n" +
        "          }\n" +
        "        }\n" +
        "      ]\n" +
        "    }\n" +
        "  ],\n" +
        "  \"tools\": [\n" +
        "    {\n" +
        "      \"functionDeclarations\": [\n" +
        "        {\n" +
        "          \"name\": \"getCoinDetails\",\n" +
        "          \"description\": \"Get crypto currency data from given currency object.\",\n" +
        "          \"parameters\": {\n" +
        "            \"type\": \"OBJECT\",\n" +
        "            \"properties\": {\n" +
        "              \"currencyName\": {\n" +
        "                \"type\": \"STRING\",\n" +
        "                \"description\": \"The currency Name, id, symbol .\"\n" +
        "              },\n" +
        "              \"currencyData\": {\n" +
        "                \"type\": \"STRING\",\n" +
        "                \"description\": \"The currency data id, symbol, current price, image, market cap extra... \"\n" +
        "              }\n" +
        "            },\n" +
        "            \"required\": [\"currencyName\",\"currencyData\"]\n" +
        "          }\n" +
        "        },\n" +
        "        {\n" +
        "          \"name\": \"find_theaters\",\n" +
        "          \"description\": \"find theaters based on location and optionally movie title which is currently playing in theaters\",\n" +
        "          \"parameters\": {\n" +
        "            \"type\": \"OBJECT\",\n" +
        "            \"properties\": {\n" +
        "              \"location\": {\n" +
        "                \"type\": \"STRING\",\n" +
        "                \"description\": \"The city and state, e.g. San Francisco, CA or a zip code e.g. 95616\"\n" +
        "              },\n" +
        "              \"movie\": {\n" +
        "                \"type\": \"STRING\",\n" +
        "                \"description\": \"Any movie title\"\n" +
        "              }\n" +
        "            },\n" +
        "            \"required\": [\"location\"]\n" +
        "          }\n" +
        "        },\n" +
        "        {\n" +
        "          \"name\": \"get_showtimes\",\n" +
        "          \"description\": \"Find the start times for movies playing in a specific theater\",\n" +
        "          \"parameters\": {\n" +
        "            \"type\": \"OBJECT\",\n" +
        "            \"properties\": {\n" +
        "              \"location\": {\n" +
        "                \"type\": \"STRING\",\n" +
        "                \"description\": \"The city and state, e.g. San Francisco, CA or a zip code e.g. 95616\"\n" +
        "              },\n" +
        "              \"movie\": {\n" +
        "                \"type\": \"STRING\",\n" +
        "                \"description\": \"Any movie title\"\n" +
        "              },\n" +
        "              \"theater\": {\n" +
        "                \"type\": \"STRING\",\n" +
        "                \"description\": \"Name of the theater\"\n" +
        "              },\n" +
        "              \"date\": {\n" +
        "                \"type\": \"STRING\",\n" +
        "                \"description\": \"Date for requested showtime\"\n" +
        "              }\n" +
        "            },\n" +
        "            \"required\": [\"location\", \"movie\", \"theater\", \"date\"]\n" +
        "          }\n" +
        "        }\n" +
        "      ]\n" +
        "    }\n" +
        "  ]\n" +
        "}";



        HttpEntity<String> request = new HttpEntity<>(body, headers);
        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<String> response = restTemplate.postForEntity(GEMINI_API_URL, request, String.class);

        ReadContext ctx = JsonPath.parse(response.getBody());

        String text = ctx.read("$.candidates[0].content.parts[0].text");
        ApiResponse ans=new ApiResponse();
        ans.setMessage(text);

        return ans;
    }

    @Override
    public CoinDTO getCoinByName(String coinName) {
        return this.makeApiRequest(coinName);
    }

    @Override
    public ApiResponse simpleChat(String prompt) {

        String GEMINI_API_URL =
                "https://generativelanguage.googleapis.com/v1beta/models/"
                + GEMINI_MODEL
                + ":generateContent?key=" + API_KEY;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        JSONObject requestBody = new JSONObject();

        // System Instruction
        JSONObject systemInstruction = new JSONObject();
        JSONArray sysPartsArray = new JSONArray();
        JSONObject sysTextObject = new JSONObject();
        sysTextObject.put("text", "You are the AI assistant for CryptoVault, a crypto trading platform. Help users with the project. Give simple, easy, and very short answers. Do not text too much long answers. If they ask how to deposit money, tell them to go to the Wallets page.");
        sysPartsArray.put(sysTextObject);
        systemInstruction.put("parts", sysPartsArray);
        requestBody.put("systemInstruction", systemInstruction);

        JSONArray contentsArray = new JSONArray();
        JSONObject contentsObject = new JSONObject();
        JSONArray partsArray = new JSONArray();
        JSONObject textObject = new JSONObject();

        textObject.put("text", prompt);
        partsArray.put(textObject);
        contentsObject.put("parts", partsArray);
        contentsArray.put(contentsObject);
        requestBody.put("contents", contentsArray);

        HttpEntity<String> requestEntity =
                new HttpEntity<>(requestBody.toString(), headers);

        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<String> response =
                restTemplate.postForEntity(
                        GEMINI_API_URL,
                        requestEntity,
                        String.class
                );

        ReadContext ctx = JsonPath.parse(response.getBody());
        String text =
                ctx.read("$.candidates[0].content.parts[0].text");

        ApiResponse apiResponse = new ApiResponse();
        apiResponse.setMessage(text);

        return apiResponse;
    }

}
