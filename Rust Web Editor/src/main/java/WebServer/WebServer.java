package main.java.WebServer;

import static spark.Spark.*;

public class WebServer {

    public static void main(String[] args) {
        // 1. 设置服务器端口，默认为 4567
        port(8080);
        
        System.out.println("Server is running on http://localhost:8080");

        // 2. 定义 API 端点 /analyse
        // 这个端点会接收来自前端的 POST 请求
        post("/analyse", (request, response) -> {
            // 从请求体中获取前端发送过来的 Rust 代码
            String rustCode = request.body();

            System.out.println("Received code:\n" + rustCode);

            // TODO: 在这里调用你的 ANTLR 分析逻辑
            // String analysisResultJson = AnalysisService.analyse(rustCode);

            // 设置响应类型为 JSON
            response.type("application/json");

            // 3. 返回一个临时的 JSON 字符串作为响应
            // 最终这里会返回真实的分析结果
            return "{\"message\": \"Code received successfully!\", \"received_code\": \"" + rustCode.replace("\"", "\\\"") + "\"}";
        });

        // 允许跨域请求，方便本地开发前端页面
        options("/*", (request, response) -> {
            String accessControlRequestHeaders = request.headers("Access-Control-Request-Headers");
            if (accessControlRequestHeaders != null) {
                response.header("Access-Control-Allow-Headers", accessControlRequestHeaders);
            }

            String accessControlRequestMethod = request.headers("Access-Control-Request-Method");
            if (accessControlRequestMethod != null) {
                response.header("Access-Control-Allow-Methods", accessControlRequestMethod);
            }

            return "OK";
        });

        before((request, response) -> response.header("Access-Control-Allow-Origin", "*"));
    }
}
