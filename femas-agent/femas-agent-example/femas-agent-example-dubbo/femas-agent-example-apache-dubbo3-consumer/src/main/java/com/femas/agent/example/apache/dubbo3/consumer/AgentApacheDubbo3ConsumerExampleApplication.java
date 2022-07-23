package com.femas.agent.example.apache.dubbo3.consumer;

import com.femas.agent.example.apache.dubbo3.api.AgentDubbo3ProviderApi;
import org.apache.dubbo.config.annotation.DubboReference;
import org.apache.dubbo.config.spring.context.annotation.EnableDubbo;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@EnableDubbo
@SpringBootApplication
public class AgentApacheDubbo3ConsumerExampleApplication {
    public static void main(String[] args) {
        SpringApplication.run(AgentApacheDubbo3ConsumerExampleApplication.class, args);
    }

    @DubboReference(version = "1.0")
    private AgentDubbo3ProviderApi providerApi;

    @GetMapping(value = "/hello/{name}")
    public String hello(@PathVariable String name){
        return providerApi.hello(name);
    }
}
