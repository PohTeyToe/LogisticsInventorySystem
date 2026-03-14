using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using LogisticsAPI.Data;
using LogisticsAPI.Hubs;
using LogisticsAPI.Middleware;
using LogisticsAPI.Models;
using LogisticsAPI.Repositories;
using LogisticsAPI.Services;
using Serilog;
using Serilog.Events;

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "LogisticsInventoryAPI")
    .WriteTo.Console(outputTemplate:
        "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .WriteTo.File("logs/api-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30,
        shared: true,
        outputTemplate:
        "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog();

// Add services to the container.
if (builder.Environment.IsProduction())
{
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("SqlServer")));
}
else
{
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));
}

// Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var jwtSecret = jwtSettings["Secret"] ?? "dev-jwt-secret-key-min-32-chars!!";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "LogisticsAPI",
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"] ?? "LogisticsDashboard",
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(1)
    };

    // SignalR sends the JWT via query string (WebSockets can't set headers)
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// In-memory caching
builder.Services.AddMemoryCache();

// Repository registrations
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IInventoryRepository, InventoryRepository>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// Service registrations
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<ICsvImportService, CsvImportService>();
builder.Services.AddScoped<IReportingService, ReportingService>();
builder.Services.AddScoped<IFinancialCalculationService, FinancialCalculationService>();
builder.Services.AddScoped<IPropertyService, PropertyService>();
builder.Services.AddScoped<IReservationService, ReservationService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IWarehouseService, WarehouseService>();
builder.Services.AddScoped<ISupplierService, SupplierService>();
builder.Services.AddScoped<IPurchaseOrderService, PurchaseOrderService>();
builder.Services.AddScoped<IStockMovementService, StockMovementService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

// SignalR
builder.Services.AddSignalR();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                  "http://localhost:5081",
                  "https://localhost:7146",
                  "http://localhost:7001",
                  "http://localhost:7002",
                  "http://localhost:5173",
                  "http://localhost:4173",
                  "https://logistics-inventory-api.onrender.com",
                  "https://logistics-inventory-api.azurewebsites.net",
                  "https://logistics-inventory-ui.azurewebsites.net",
                  "https://logistics-inventory-api-abdallah.azurewebsites.net",
                  "https://logistics-inventory-ui-abdallah.azurewebsites.net",
                  "https://logistics-dashboard.vercel.app",
                  "https://lemon-island-044a86a0f.1.azurestaticapps.net")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Health checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>("database");

// Rate limiting
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("fixed", opt =>
    {
        opt.PermitLimit = 100;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 10;
    });
});

builder.Services.AddControllers()
    .AddXmlDataContractSerializerFormatters()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Logistics Inventory API",
        Version = "v1",
        Description = "RESTful API for logistics inventory management with multi-tenant support"
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseSerilogRequestLogging(options =>
{
    options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
    {
        var tenantId = httpContext.Items.TryGetValue("TenantId", out var tid) ? tid : null;
        diagnosticContext.Set("TenantId", tenantId);
    };
});

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors();
app.UseRateLimiter();
app.UseErrorHandling();

app.UseAuthentication();
app.UseAuthorization();

app.UseTenantMiddleware();

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.MapControllers().RequireRateLimiting("fixed");
app.MapHub<InventoryHub>("/hubs/inventory");
app.MapHealthChecks("/api/health", new HealthCheckOptions
{
    ResponseWriter = async (context, report) =>
    {
        context.Response.ContentType = "application/json";
        var result = System.Text.Json.JsonSerializer.Serialize(new
        {
            status = report.Status.ToString(),
            checks = report.Entries.Select(e => new
            {
                name = e.Key,
                status = e.Value.Status.ToString(),
                duration = e.Value.Duration.TotalMilliseconds
            })
        });
        await context.Response.WriteAsync(result);
    }
});

// Seed data on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await SeedData.InitializeAsync(db);
}

app.Run();

// Make Program class accessible for WebApplicationFactory in integration tests
public partial class Program { }
