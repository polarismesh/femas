package com.tencent.tsf.femas.governance.ratelimit.impl;

import com.tencent.tsf.femas.common.entity.Service;
import com.tencent.tsf.femas.common.exception.FemasRuntimeException;
import com.tencent.tsf.femas.governance.plugin.context.ConfigContext;
import com.tencent.tsf.femas.governance.ratelimit.RateLimiter;
import com.tencent.tsf.femas.governance.ratelimit.entity.RateLimiterRule;

import java.util.concurrent.Semaphore;

/**
 * 基于信号量实现的限流器
 *
 * @author huyuanxin
 */
public class SemaphoreBasedRateLimiter implements RateLimiter<RateLimiterRule> {

    /**
     * 信号量
     */
    private final Semaphore semaphore;

    /**
     * 是否是公平锁
     */
    private final Boolean fair;

    /**
     * 基于信号量的限流器
     * <p>
     * permits和fair用于 {@link Semaphore#Semaphore(int, boolean)}
     * </p>
     *
     * @param permits 信号量的数量
     * @param fair    信号量是公平锁还是非公平锁
     */
    public SemaphoreBasedRateLimiter(int permits, boolean fair) {
        this.fair = fair;
        this.semaphore = new Semaphore(permits, fair);
    }

    /**
     * 基于信号量的限流器
     *
     * @param permits 信号量的数量
     */
    public SemaphoreBasedRateLimiter(int permits) {
        this(permits, false);
    }

    @Override
    public boolean acquire() {
        return acquire(1);
    }

    @Override
    public boolean acquire(int permits) {
        if (permits <= 0) {
            return true;
        }
        if (permits > semaphore.availablePermits()) {
            return false;
        }
        return semaphore.tryAcquire(permits);
    }

    /**
     * 释放信号量
     */
    public void release() {
        release(1);
    }

    /**
     * 释放信号量
     *
     * @param permits 释放信号的数量
     */
    public void release(int permits) {
        semaphore.release(permits);
    }

    @Override
    public String getType() {
        return Boolean.TRUE.equals(fair) ? "FairSemaphoreBasedRateLimiter" : "UnfairSemaphoreBasedRateLimiter";
    }

    @Override
    public void init(ConfigContext conf) throws FemasRuntimeException {
        // nothing to do
    }

    @Override
    public void destroy() {
        // nothing to do
    }

    @Override
    public void buildCollector(Service service) {
        // nothing to do
    }

    @Override
    public void update(RateLimiterRule rule) {
        // nothing to do
    }

    @Override
    public void setInsId(String insId) {
        // nothing to do
    }

}
