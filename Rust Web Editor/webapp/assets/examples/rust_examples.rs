// Rust Web Editor - 示例代码集合

// 1. 基础语法示例
fn main() {
    println!("Hello, Rust World!");
    
    // 变量和类型
    let x: i32 = 42;
    let y = "Hello";
    let mut z = 10;
    z += 5;
    
    // 控制流
    if x > 0 {
        println!("x is positive: {}", x);
    } else {
        println!("x is not positive");
    }
    
    // 循环
    for i in 1..=5 {
        println!("Count: {}", i);
    }
    
    // 函数调用
    let result = add_numbers(10, 20);
    println!("10 + 20 = {}", result);
    
    // 结构体使用
    let point = Point::new(3.0, 4.0);
    println!("Point: ({}, {})", point.x, point.y);
    
    // 枚举和模式匹配
    let color = Color::Red;
    match color {
        Color::Red => println!("It's red!"),
        Color::Green => println!("It's green!"),
        Color::Blue => println!("It's blue!"),
    }
    
    // 错误处理
    match divide(10.0, 2.0) {
        Ok(result) => println!("Division result: {}", result),
        Err(err) => println!("Error: {}", err),
    }
}

// 2. 函数示例
fn add_numbers(a: i32, b: i32) -> i32 {
    a + b
}

fn fibonacci(n: u32) -> u32 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err("Cannot divide by zero".to_string())
    } else {
        Ok(a / b)
    }
}

// 3. 结构体示例
struct Point {
    x: f64,
    y: f64,
}

impl Point {
    fn new(x: f64, y: f64) -> Self {
        Point { x, y }
    }
    
    fn distance(&self, other: &Point) -> f64 {
        ((self.x - other.x).powi(2) + (self.y - other.y).powi(2)).sqrt()
    }
    
    fn origin() -> Self {
        Point { x: 0.0, y: 0.0 }
    }
}

// 4. 枚举示例
enum Color {
    Red,
    Green,
    Blue,
}

enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(Color),
}

// 5. 泛型示例
struct Container<T> {
    value: T,
}

impl<T> Container<T> {
    fn new(value: T) -> Self {
        Container { value }
    }
    
    fn get(&self) -> &T {
        &self.value
    }
}

// 6. Trait 示例
trait Drawable {
    fn draw(&self);
}

impl Drawable for Point {
    fn draw(&self) {
        println!("Drawing point at ({}, {})", self.x, self.y);
    }
}

// 7. 错误示例（用于测试错误处理）
/*
// 取消注释以下代码来测试错误检测

fn error_example() {
    let x = 5
    let y = "hello" + 5;
    let z = undefined_function();
    
    if x = 10 {
        println!("This is wrong");
    }
    
    let mut vec = Vec::new();
    vec.push(1);
    vec.push("string"); // 类型不匹配
}
*/
