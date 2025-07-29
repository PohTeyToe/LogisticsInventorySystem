using Microsoft.EntityFrameworkCore;
using LogisticsAPI.Data;
using LogisticsAPI.Middleware;
using LogisticsAPI.Repositories;
using LogisticsAPI.Services;

var builder = WebApplication.CreateBuilder(args);

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

// Repository registrations
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IInventoryRepository, InventoryRepository>();

// Service registrations
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<ICsvImportService, CsvImportService>();
builder.Services.AddScoped<IReportingService, ReportingService>();
builder.Services.AddScoped<IFinancialCalculationService, FinancialCalculationService>();

builder.Services.AddControllers()
    .AddXmlDataContractSerializerFormatters();

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
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseErrorHandling();
app.UseTenantMiddleware();
app.UseHttpsRedirection();

app.MapControllers();

app.Run();
