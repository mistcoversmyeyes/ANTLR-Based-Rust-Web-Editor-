package CompilerFronted.AnalysisService;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.lang.reflect.Type;
import java.util.Map;
import java.util.List;

public class AnalysisServiceTest {

    @Test
    void testAnalyseWithValidRustCode() {
        String rustCode = "fn main() {\n    println!(\"Hello, world!\");\n}";
        String jsonResult = AnalysisService.analyse(rustCode);

        assertNotNull(jsonResult, "JSON result should not be null");
        assertFalse(jsonResult.isEmpty(), "JSON result should not be empty");

        Gson gson = new Gson();
        Type type = new TypeToken<Map<String, Object>>(){}.getType();
        Map<String, Object> result = gson.fromJson(jsonResult, type);

        assertTrue((Boolean) result.get("success"), "Analysis should be successful");
        
        // 验证 tokens 列表不为空
        List<Map<String, Object>> tokens = (List<Map<String, Object>>) result.get("tokens");
        assertNotNull(tokens, "Tokens list should not be null");
        assertFalse(tokens.isEmpty(), "Tokens list should not be empty");

        // 验证 errors 列表为空
        List<Map<String, Object>> errors = (List<Map<String, Object>>) result.get("errors");
        assertNotNull(errors, "Errors list should not be null");
        assertTrue(errors.isEmpty(), "Errors list should be empty for valid code");

        // 验证 parseTree 存在且不为空
        Map<String, Object> parseTree = (Map<String, Object>) result.get("parseTree");
        assertNotNull(parseTree, "Parse tree should not be null");
        assertNotNull(parseTree.get("lisp"), "LISP format parse tree should not be null");
        assertNotNull(parseTree.get("dot"), "DOT format parse tree should not be null");
    }

    @Test
    void testAnalyseWithInvalidRustCode() {
        String rustCode = "fn main() {\n    println!(\"Hello, world!\")\n}"; // Missing semicolon
        String jsonResult = AnalysisService.analyse(rustCode);

        assertNotNull(jsonResult, "JSON result should not be null");
        assertFalse(jsonResult.isEmpty(), "JSON result should not be empty");

        Gson gson = new Gson();
        Type type = new TypeToken<Map<String, Object>>(){}.getType();
        Map<String, Object> result = gson.fromJson(jsonResult, type);

        assertFalse((Boolean) result.get("success"), "Analysis should not be successful for invalid code");
        
        // 验证 errors 列表不为空
        List<Map<String, Object>> errors = (List<Map<String, Object>>) result.get("errors");
        assertNotNull(errors, "Errors list should not be null");
        assertFalse(errors.isEmpty(), "Errors list should not be empty for invalid code");
    }
}