package WebServer;

import io.javalin.Javalin;
import CompilerFronted.AnalysisService.*;

public class WebServer {
    public static void main(String[] args) {
        Javalin app = Javalin.create().start(7070);
        
        // 配置 CORS
        app.before(ctx -> {
            ctx.header("Access-Control-Allow-Origin", "*");
        });

        app.post("/analyse", ctx -> {
            // 从请求体中获取 Rust 代码
            String rustCode = ctx.body();
            // 调用分析服务
            String resultJson = AnalysisService.analyse(rustCode);
            // 将结果作为 JSON 返回
            ctx.json(resultJson);
        });

        System.out.println("WebServer is running on port 7070...");
    }
}
