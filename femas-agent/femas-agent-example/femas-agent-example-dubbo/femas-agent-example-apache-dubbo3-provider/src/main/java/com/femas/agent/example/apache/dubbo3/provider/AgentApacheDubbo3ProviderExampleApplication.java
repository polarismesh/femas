package com.femas.agent.example.apache.dubbo3.provider;

import org.apache.dubbo.config.spring.context.annotation.EnableDubbo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@EnableDubbo
@SpringBootApplication
public class AgentApacheDubbo3ProviderExampleApplication {
    public static void main(String[] args) {
        SpringApplication.run(AgentApacheDubbo3ProviderExampleApplication.class, args);
    }
}
