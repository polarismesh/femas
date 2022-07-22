package com.tencent.tsf.femas.governance.ratelimit.impl;

import com.tencent.tsf.femas.common.entity.Service;
import com.tencent.tsf.femas.common.exception.FemasRuntimeException;
import com.tencent.tsf.femas.governance.plugin.context.ConfigContext;
import com.tencent.tsf.femas.governance.ratelimit.RateLimiter;
import com.tencent.tsf.femas.governance.ratelimit.entity.RateLimiterRule;

import java.math.BigDecimal;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/**
 * 令牌桶限流算法
 *
 * @author huyuanxin
 */
public class TokenBucketRateLimiter implements RateLimiter<RateLimiterRule> {

    /**
     * 速率
     */
    private final BigDecimal permitsPerSecond;

    /**
     * 桶最大数量
     */
    private final BigDecimal bucketMaxCapacity;

    /**
     * 当前令牌数量
     */
    private final AtomicReference<BigDecimal> currentCapacity;

    private final ScheduledExecutorService executorService = new ScheduledThreadPoolExecutor(1, r -> {
        Thread thread = new Thread(r, "Bucket Increase");
        thread.setDaemon(true);
        return thread;
    });

    public TokenBucketRateLimiter(double permitsPerSecond, long bucketMaxCapacity) {
        if (permitsPerSecond > bucketMaxCapacity) {
            permitsPerSecond = bucketMaxCapacity;
        }
        this.permitsPerSecond = BigDecimal.valueOf(permitsPerSecond);
        this.bucketMaxCapacity = BigDecimal.valueOf(bucketMaxCapacity);
        currentCapacity = new AtomicReference<>(BigDecimal.valueOf(bucketMaxCapacity));
        // 开始增加令牌
        executorService.execute(new Increase());
    }

    @Override
    public boolean acquire() {
        return acquire(1);
    }

    @Override
    public synchronized boolean acquire(int permits) {
        if (currentCapacity.get().compareTo(BigDecimal.valueOf(permits)) < 0) {
            return false;
        }
        currentCapacity.set(currentCapacity.get().subtract(BigDecimal.valueOf(permits)));
        return true;
    }

    @Override
    public void update(RateLimiterRule rule) {
        // nothing to do
    }

    @Override
    public String getType() {
        return "";
    }

    @Override
    public void init(ConfigContext conf) throws FemasRuntimeException {
        // nothing to do
    }

    @Override
    public void buildCollector(Service service) {
        // nothing to do
    }

    @Override
    public void destroy() {
        // nothing to do
    }

    @Override
    public void setInsId(String insId) {
        // nothing to do
    }

    class Increase implements Runnable {
        @Override
        public void run() {
            try {
                if (currentCapacity.get().compareTo(bucketMaxCapacity.subtract(permitsPerSecond)) <= 0) {
                    currentCapacity.set(currentCapacity.get().add(permitsPerSecond));
                }
            } finally {
                executorService.schedule(this, 1, TimeUnit.SECONDS);
            }
        }
    }
}
