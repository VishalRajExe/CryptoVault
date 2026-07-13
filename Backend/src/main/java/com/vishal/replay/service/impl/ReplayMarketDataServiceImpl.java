package com.vishal.replay.service.impl;

import com.vishal.replay.model.ReplayMarketData;
import com.vishal.replay.repository.ReplayMarketDataRepository;
import com.vishal.replay.service.ReplayMarketDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Implementation of ReplayMarketDataService with pagination support.
 */
@Service
public class ReplayMarketDataServiceImpl implements ReplayMarketDataService {

    @Autowired
    private ReplayMarketDataRepository replayMarketDataRepository;

    @Override
    public java.util.List<ReplayMarketData> getMarketData(String symbol, String interval, Long startTime, Long endTime, Integer limit, Integer offset) {
        // Create PageRequest for pagination
        int page = (offset != null && offset >= 0) ? offset : 0;
        int size = (limit != null && limit > 0) ? limit : Integer.MAX_VALUE; // If limit not specified or invalid, get all

        Page<ReplayMarketData> pageResult = replayMarketDataRepository.findBySymbolAndIntervalAndOpenTimeBetweenOrderByOpenTimeAsc(
                symbol, interval, startTime, endTime, PageRequest.of(page, size, Sort.by("openTime").ascending()));

        return pageResult.getContent();
    }

    @Override
    public Long countMarketData(String symbol, String interval, Long startTime, Long endTime) {
        return replayMarketDataRepository.countBySymbolAndIntervalAndOpenTimeBetween(symbol, interval, startTime, endTime);
    }

    @Override
    public ReplayMarketData getLatestMarketData(String symbol, String interval, Long endTime) {
        return replayMarketDataRepository.findTopBySymbolAndIntervalAndOpenTimeLessThanOrderByOpenTimeDesc(symbol, interval, endTime);
    }

    @Override
    public java.util.List<String> getDistinctSymbols() {
        return replayMarketDataRepository.findDistinctSymbol();
    }
}