package com.tencent.tsf.femas.governance.ratelimit;

import com.tencent.tsf.femas.common.entity.Service;
import com.tencent.tsf.femas.common.util.TimeUtil;
import com.tencent.tsf.femas.governance.ratelimit.impl.LeakBucketRateLimiter;
import com.tencent.tsf.femas.governance.ratelimit.impl.SemaphoreBasedRateLimiter;
import com.tencent.tsf.femas.governance.ratelimit.impl.SlidingWindowRateLimiter;
import com.tencent.tsf.femas.governance.ratelimit.impl.WarmUpSlidingWindowRateLimiter;
import org.junit.Assert;
import org.junit.Test;

public class RateLimiterManagerTest {

    Service service = new Service("default_ns", "helloservice");

    public static void main(String[] args) {
        Service service = new Service("default_ns", "helloservice");
        SlidingWindowRateLimiter slidingWindowRateLimiter = new SlidingWindowRateLimiter(1000, 100);
        for (int i = 0; i < 1000; i++) {
            System.out.println(slidingWindowRateLimiter.acquire());
        }
    }

    /**
     * 测试 SlidingWindowRateLimiter
     */
    @Test
    public void test01() {
        /**
         * 1s 限制 10个请求
         */
        SlidingWindowRateLimiter rateLimiter = new SlidingWindowRateLimiter(1000, 10);
        RateLimiterManager.refreshRateLimiter(service, rateLimiter);

        for (int i = 0; i < 10; i++) {
            Assert.assertTrue(RateLimiterManager.acquire(service));
        }

        for (int i = 0; i < 10; i++) {
            Assert.assertFalse(RateLimiterManager.acquire(service));
        }
    }

    /**
     * 测试 SlidingWindowRateLimiter
     */
    @Test
    public void test02() {
        WarmUpSlidingWindowRateLimiter rateLimiter = new WarmUpSlidingWindowRateLimiter(1000, 10, 1000, 2);
        RateLimiterManager.refreshRateLimiter(service, rateLimiter);

        for (int i = 0; i < 20; i++) {
            RateLimiterManager.acquire(service);
        }

        TimeUtil.silentlySleep(500);

        for (int i = 0; i < 20; i++) {
            RateLimiterManager.acquire(service);
        }
    }

    /**
     * 测试 LeakBucket
     */
    @Test
    public void test03() {
        LeakBucketRateLimiter rateLimiter = new LeakBucketRateLimiter(1000, 1);
        RateLimiterManager.refreshRateLimiter(service, rateLimiter);

        TimeUtil.silentlySleep(1100);
        for (int i = 0; i < 1; i++) {
            Assert.assertTrue(RateLimiterManager.acquire(service));
        }

        for (int i = 0; i < 10; i++) {
            Assert.assertFalse(RateLimiterManager.acquire(service));
        }
    }

    /**
     * 测试 SemaphoreBased
     */
    @Test
    public void test04() {
        SemaphoreBasedRateLimiter rateLimiter = new SemaphoreBasedRateLimiter(10);
        RateLimiterManager.refreshRateLimiter(service, rateLimiter);

        for (int i = 0; i < 10; i++) {
            Assert.assertTrue(RateLimiterManager.acquire(service));
        }

        for (int i = 0; i < 10; i++) {
            Assert.assertFalse(RateLimiterManager.acquire(service));
        }
    }
}
