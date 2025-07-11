package WebServer;

import io.javalin.Javalin;
import CompilerFronted.AnalysisService.*;

public class WebServer {
    public static void main(String[] args) {
        Javalin app = Javalin.create(config -> {
            // 配置静态文件服务，服务webapp目录中的文件
            config.staticFiles.add(staticFiles -> {
                staticFiles.hostedPath = "/static";
                staticFiles.directory = "/static";
            });
        }).start(7071);
        
        // 配置 CORS
        app.before(ctx -> {
            ctx.header("Access-Control-Allow-Origin", "*");
            ctx.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            ctx.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
        });

        // 首页路由
        app.get("/", ctx -> {
            ctx.redirect("/static/index.html");
        });

        app.post("/analyse", ctx -> {
            // 从请求体中获取 Rust 代码
            String rustCode = ctx.body();
            // 调用分析服务
            String resultJson = AnalysisService.analyse(rustCode);
            // 将结果作为 JSON 返回
            ctx.json(resultJson);
        });

        System.out.println("WebServer is running on port 7071...");
    }
}
