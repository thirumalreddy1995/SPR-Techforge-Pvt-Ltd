
import React, { useState } from 'react';
import { Card } from '../../components/Components';

const CodeBlock: React.FC<{ code: string; language: string; filename: string }> = ({ code, language, filename }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    const btn = document.getElementById(`copy-btn-${filename.replace(/\./g, '-')}`);
    if (btn) {
      const original = btn.innerText;
      btn.innerText = 'Copied!';
      setTimeout(() => btn.innerText = original, 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="rounded-lg overflow-hidden border border-gray-700 bg-[#1e1e1e] text-gray-300 shadow-lg my-4">
      <div className="flex justify-between items-center bg-[#2d2d2d] px-4 py-2 border-b border-gray-700">
        <span className="font-mono text-sm font-bold text-gray-100">{filename}</span>
        <div className="flex gap-2">
            <button id={`copy-btn-${filename.replace(/\./g, '-')}`} onClick={handleCopy} className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-white transition-colors font-medium">Copy</button>
            <button onClick={handleDownload} className="text-xs bg-indigo-700 hover:bg-indigo-600 px-3 py-1.5 rounded text-white transition-colors font-medium">Download</button>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-[#1e1e1e]">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export const Migration: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Shared' | 'Backend' | 'Client'>('Shared');

  // --- C# SHARED MODELS ---
  const modelsCode = `using System;
using System.ComponentModel.DataAnnotations;

namespace SprTechforge.Shared.Models
{
    public enum TransactionType { Income, Expense, Transfer, Refund }
    public enum AccountType { Bank, Cash, Debtor, Creditor, Expense, Income, Equity }
    public enum CandidateStatus { Training, ReadyForInterview, Placed, Discontinued }

    public class Candidate
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        [Required] public string Name { get; set; }
        [Required] public string BatchId { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }
        public decimal AgreedAmount { get; set; }
        public CandidateStatus Status { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime JoinedDate { get; set; } = DateTime.UtcNow;
    }

    public class Transaction
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public TransactionType Type { get; set; }
        public decimal Amount { get; set; }
        [Required] public string Description { get; set; }
        
        // Polymorphic Relationships (Simplified for EF Core)
        public string FromEntityId { get; set; }
        public string FromEntityType { get; set; } // "Account" or "Candidate"
        
        public string ToEntityId { get; set; }
        public string ToEntityType { get; set; } // "Account" or "Candidate"
        
        public bool IsLocked { get; set; }
    }
}`;

  // --- BACKEND API & DB CONTEXT ---
  const dbContextCode = `using Microsoft.EntityFrameworkCore;
using SprTechforge.Shared.Models;

namespace SprTechforge.Server.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Candidate> Candidates { get; set; }
        public DbSet<Account> Accounts { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<User> Users { get; set; }
    }
}`;

  const controllerCode = `using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SprTechforge.Server.Data;
using SprTechforge.Shared.Models;

namespace SprTechforge.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TransactionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TransactionsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<Transaction>>> GetTransactions()
        {
            return await _context.Transactions
                .OrderByDescending(t => t.Date)
                .ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Transaction>> CreateTransaction(Transaction transaction)
        {
            _context.Transactions.Add(transaction);
            
            // Basic Double Entry Logic (Simplified)
            // In a real app, you would fetch related accounts and update balances here within a TransactionScope
            
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetTransactions), new { id = transaction.Id }, transaction);
        }
    }
}`;

  // --- CLIENT BLAZOR ---
  const razorListCode = `@page "/finance/transactions"
@inject HttpClient Http
@inject IDialogService DialogService
@using SprTechforge.Shared.Models

<MudContainer MaxWidth="MaxWidth.ExtraLarge" Class="mt-6">
    <div class="d-flex justify-space-between align-center mb-4">
        <MudText Typo="Typo.h4">Transactions</MudText>
        <MudButton Variant="Variant.Filled" Color="Color.Primary" StartIcon="@Icons.Material.Filled.Add" Link="/finance/transactions/new">
            New Entry
        </MudButton>
    </div>

    <MudPaper Elevation="2" Class="pa-4">
        <MudTable Items="@_transactions" Dense="true" Hover="true" Filter="new Func<Transaction,bool>(FilterFunc)">
            <ToolBarContent>
                <MudText Typo="Typo.h6">Journal</MudText>
                <MudSpacer />
                <MudTextField @bind-Value="_searchString" Placeholder="Search..." Adornment="Adornment.Start" AdornmentIcon="@Icons.Material.Filled.Search" IconSize="Size.Medium" Class="mt-0"></MudTextField>
            </ToolBarContent>
            <HeaderContent>
                <MudTh>Date</MudTh>
                <MudTh>Description</MudTh>
                <MudTh>Type</MudTh>
                <MudTh Style="text-align:right">Amount</MudTh>
                <MudTh>Source</MudTh>
                <MudTh>Destination</MudTh>
                <MudTh>Actions</MudTh>
            </HeaderContent>
            <RowTemplate>
                <MudTd DataLabel="Date">@context.Date.ToShortDateString()</MudTd>
                <MudTd DataLabel="Description">@context.Description</MudTd>
                <MudTd DataLabel="Type">
                    <MudChip Color="@GetTypeColor(context.Type)" Size="Size.Small">@context.Type</MudChip>
                </MudTd>
                <MudTd DataLabel="Amount" Style="text-align:right; font-weight:bold;">@context.Amount.ToString("C")</MudTd>
                <MudTd DataLabel="Source">@context.FromEntityId</MudTd>
                <MudTd DataLabel="Destination">@context.ToEntityId</MudTd>
                <MudTd DataLabel="Actions">
                    <MudIconButton Icon="@Icons.Material.Filled.Visibility" Size="Size.Small" OnClick="@(() => OpenDetails(context))" />
                </MudTd>
            </RowTemplate>
            <PagerContent>
                <MudTablePager />
            </PagerContent>
        </MudTable>
    </MudPaper>
</MudContainer>

@code {
    private List<Transaction> _transactions = new();
    private string _searchString = "";

    protected override async Task OnInitializedAsync()
    {
        _transactions = await Http.GetFromJsonAsync<List<Transaction>>("api/transactions") ?? new();
    }

    private Color GetTypeColor(TransactionType type) => type switch
    {
        TransactionType.Income => Color.Success,
        TransactionType.Expense => Color.Error,
        _ => Color.Default
    };

    private bool FilterFunc(Transaction t)
    {
        if (string.IsNullOrWhiteSpace(_searchString)) return true;
        return t.Description.Contains(_searchString, StringComparison.OrdinalIgnoreCase);
    }

    private void OpenDetails(Transaction t)
    {
        var parameters = new DialogParameters { ["transaction"] = t };
        DialogService.Show<TransactionDetailsDialog>("Transaction Details", parameters);
    }
}`;

  const serviceCode = `using System.Net.Http.Json;
using SprTechforge.Shared.Models;

namespace SprTechforge.Client.Services
{
    public class TransactionService
    {
        private readonly HttpClient _http;

        public TransactionService(HttpClient http)
        {
            _http = http;
        }

        public async Task<List<Transaction>> GetAllAsync()
        {
            return await _http.GetFromJsonAsync<List<Transaction>>("api/transactions");
        }

        public async Task CreateAsync(Transaction transaction)
        {
            await _http.PostAsJsonAsync("api/transactions", transaction);
        }
    }
}`;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white p-8 rounded-xl shadow-lg">
         <h1 className="text-3xl font-bold mb-3">C# .NET Solution Builder</h1>
         <p className="text-indigo-100 text-lg max-w-3xl">
           This tool generates the complete source code for an <strong>ASP.NET Core Hosted Blazor WebAssembly</strong> solution. 
           Copy the files below into a new Visual Studio Solution to run this application natively on the Microsoft Stack.
         </p>
      </div>

      <div className="flex gap-2 border-b border-gray-300 pb-0">
        <button 
             onClick={() => setActiveTab('Shared')}
             className={`px-6 py-3 font-medium rounded-t-lg transition-all ${activeTab === 'Shared' ? 'bg-white border-t border-l border-r border-gray-300 text-indigo-600 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
           >
             1. Shared Models
        </button>
        <button 
             onClick={() => setActiveTab('Backend')}
             className={`px-6 py-3 font-medium rounded-t-lg transition-all ${activeTab === 'Backend' ? 'bg-white border-t border-l border-r border-gray-300 text-indigo-600 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
           >
             2. Backend (API)
        </button>
        <button 
             onClick={() => setActiveTab('Client')}
             className={`px-6 py-3 font-medium rounded-t-lg transition-all ${activeTab === 'Client' ? 'bg-white border-t border-l border-r border-gray-300 text-indigo-600 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
           >
             3. Client (Blazor)
        </button>
      </div>

      <div className="bg-white border-l border-r border-b border-gray-300 p-6 rounded-b-xl shadow-sm">
         {activeTab === 'Shared' && (
            <div>
               <div className="mb-4 border-l-4 border-indigo-500 pl-4">
                   <h3 className="text-lg font-bold text-gray-900">Shared Library</h3>
                   <p className="text-gray-600">Contains Data Models and Enums used by both Client and Server.</p>
               </div>
               <CodeBlock filename="SprTechforge.Shared/Models/Domain.cs" language="csharp" code={modelsCode} />
            </div>
         )}

         {activeTab === 'Backend' && (
            <div>
               <div className="mb-4 border-l-4 border-indigo-500 pl-4">
                   <h3 className="text-lg font-bold text-gray-900">Server Project (ASP.NET Core Web API)</h3>
                   <p className="text-gray-600">Handles Database connections (EF Core) and HTTP API endpoints.</p>
               </div>
               <CodeBlock filename="SprTechforge.Server/Data/AppDbContext.cs" language="csharp" code={dbContextCode} />
               <CodeBlock filename="SprTechforge.Server/Controllers/TransactionsController.cs" language="csharp" code={controllerCode} />
            </div>
         )}

         {activeTab === 'Client' && (
            <div>
               <div className="mb-4 border-l-4 border-indigo-500 pl-4">
                   <h3 className="text-lg font-bold text-gray-900">Client Project (Blazor WASM)</h3>
                   <p className="text-gray-600">UI Logic (Razor Components) running in the browser via WebAssembly.</p>
               </div>
               <div className="mb-4 bg-blue-50 text-blue-800 p-3 rounded text-sm border border-blue-200">
                 <strong>Dependency:</strong> Requires <code>MudBlazor</code> NuGet package for UI components.
               </div>
               <CodeBlock filename="SprTechforge.Client/Pages/Transactions.razor" language="razor" code={razorListCode} />
               <CodeBlock filename="SprTechforge.Client/Services/TransactionService.cs" language="csharp" code={serviceCode} />
            </div>
         )}
         
         <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Quick Start Instructions</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                <li>Create a new solution: <code>dotnet new blazorwasm --hosted -o SprTechforge</code></li>
                <li>Install MudBlazor: <code>dotnet add SprTechforge.Client package MudBlazor</code></li>
                <li>Replace the generated <code>Shared/WeatherForecast.cs</code> with the code in <strong>Shared Models</strong>.</li>
                <li>Set up the DbContext in <code>Server/Program.cs</code> and copy the <strong>Backend</strong> code.</li>
                <li>Copy the <strong>Client</strong> code to your Pages folder and run the solution.</li>
            </ol>
         </div>
      </div>
    </div>
  );
};
