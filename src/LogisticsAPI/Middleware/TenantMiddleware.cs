using LogisticsAPI.Data;

namespace LogisticsAPI.Middleware
{
    public class TenantMiddleware
    {
        private readonly RequestDelegate _next;

        public TenantMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // FIXME: tenant resolution should use JWT claims in production
            var tenantIdHeader = context.Request.Headers["X-Tenant-Id"].FirstOrDefault();
            var tenantId = 1; // Default tenant

            if (!string.IsNullOrEmpty(tenantIdHeader) && int.TryParse(tenantIdHeader, out var parsedId))
            {
                tenantId = parsedId;
            }

            // Set tenant on the DbContext
            var dbContext = context.RequestServices.GetRequiredService<ApplicationDbContext>();
            dbContext.SetTenantId(tenantId);

            // Store tenant ID in HttpContext.Items for other services
            context.Items["TenantId"] = tenantId;

            await _next(context);
        }
    }

    public static class TenantMiddlewareExtensions
    {
        public static IApplicationBuilder UseTenantMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<TenantMiddleware>();
        }
    }
}
