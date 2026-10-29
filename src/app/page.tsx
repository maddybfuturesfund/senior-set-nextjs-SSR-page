import { Suspense } from 'react';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import './components/dashboard.css';

let feedItems = [
  'System initialized successfully at build time.',
  'Inventory sync completed on server request.'
];

let catalogData = Array.from({ length: 500 }, (_, i) => ({
  id: i + 1,
  name: `Asset Item #${i + 1}`,
  category: i % 2 === 0 ? 'Pharmaceuticals' : 'Hardware',
  status: i % 3 === 0 ? 'Critical' : 'Stable',
  stock: Math.floor(Math.random() * 1000)
}));

async function DashboardContent({ searchParams }: { searchParams: Promise<{ inspect?: string, step?: string, itemName?: string, wizard?: string }> }) {
  const params = await searchParams;
  const inspectId = params?.inspect ? parseInt(params.inspect, 10) : null;
  const selectedItem = catalogData.find((item) => item.id === inspectId);

  const currentStep = params?.step || '1';
  const savedItemName = params?.itemName || '';
  const wizardOpen = params?.wizard === 'open' || currentStep !== '1';

  async function handleNextStep(formData: FormData) {
    'use server';
    const itemName = formData.get('itemName') as string;
    if (!itemName) return;

    // Redirect to step 2, keeping the wizard open and passing itemName in the URL
    redirect(`/?wizard=open&step=2&itemName=${encodeURIComponent(itemName)}`);
  }

  async function handleFinalSubmit(formData: FormData) {
    'use server';
    const itemName = formData.get('itemName') as string;
    const category = formData.get('category') as string;

    if (!itemName || !category) return;

    // Mutate server-side data store
    catalogData.unshift({
      id: catalogData.length + 1,
      name: itemName,
      category: category,
      status: 'Stable',
      stock: 100
    });

    feedItems.unshift(`New asset "${itemName}" added via multi-step Server Action at ${new Date().toLocaleTimeString()}`);

    revalidatePath('/');
    redirect('/'); // Reset back to base URL when finished
  }

  async function handleAddInventoryItem(formData: FormData) {
    'use server';
    const itemName = formData.get('itemName') as string;
    const category = formData.get('category') as string;

    if (!itemName) return;

    catalogData.unshift({
      id: catalogData.length + 1,
      name: itemName,
      category: category || 'General',
      status: 'Stable',
      stock: 100
    });

    feedItems.unshift(`New item "${itemName}" added via Server Action at ${new Date().toLocaleTimeString()}`);
    revalidatePath('/');
  }

  async function handleLogInjection() {
    'use server';
    feedItems.unshift(`Manual telemetry log injected at ${new Date().toLocaleTimeString()}`);
    revalidatePath('/');
  }

  return (
    <main className="dashboard-container">
      <header>
        <h1>Supply Chain Dashboard (SSR + Server Actions)</h1>
        <p>Zero client-side JavaScript. Driven entirely by server actions and URL state.</p>
      </header>

      {/* FEATURE 1: Native HTML Accordion */}
      <details className="accordion-section">
        <summary className="accordion-header">
          Quick System Overview & Telemetry
        </summary>
        <div className="accordion-content">
          <p>System operational status: Nominal. Pure server architecture active.</p>
          <form action={handleLogInjection}>
            <button type="submit" style={{ marginTop: '10px' }}>
              Simulate Real-time Log Injection
            </button>
          </form>
        </div>
      </details>

      {/* FEATURE 2: Inventory Intake Wizard */}
      <details className="accordion-section" open={wizardOpen}>
        <summary className="accordion-header">
          Inventory Intake Wizard (Multi-Step Form)
        </summary>
        <div className="accordion-content">

          {currentStep === '1' && (
            <form action={handleNextStep}>
              <h3>Step 1: Basic Info</h3>
              <div className="form-group">
                <label>Item Name</label>
                <input
                  type="text"
                  name="itemName"
                  defaultValue={savedItemName}
                  placeholder="Enter item name..."
                  required
                />
              </div>
              <button type="submit">Next Step</button>
            </form>
          )}

          {currentStep === '2' && (
            <form action={handleFinalSubmit}>
              <h3>Step 2: Details & Confirmation</h3>
              {/* Hidden input to pass the itemName forward to the final submit action */}
              <input type="hidden" name="itemName" value={savedItemName} />

              <p style={{ marginBottom: '12px', fontSize: '14px' }}>
                <strong>Item:</strong> {savedItemName}
              </p>

              <div className="form-group">
                <label>Category</label>
                <select name="category" required>
                  <option value="">Select Category</option>
                  <option value="Pharmaceuticals">Pharmaceuticals</option>
                  <option value="Hardware">Hardware</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit">Complete Submission</button>
                {/* Reset link takes user back to base URL */}
                <a href="/" style={{ textDecoration: 'none' }}>
                  <button type="button" style={{ background: '#6b6375' }}>Reset Form</button>
                </a>
              </div>
            </form>
          )}

        </div>
      </details>

      {/* FEATURE 3: Live Activity Stream */}
      <details className="accordion-section">
        <summary className="accordion-header">
          Live Activity Stream ({feedItems.length} Server Logs)
        </summary>
        <div className="accordion-content">
          <div className="feed-container">
            {feedItems.map((item, index) => (
              <div key={index} className="feed-item">{item}</div>
            ))}
          </div>
        </div>
      </details>

      {/* FEATURE 4: 500-Row Table with Server-Driven Inspection Links */}
      <details className="accordion-section" open={selectedItem !== null}>
        <summary className="accordion-header">
          Full Asset Catalog Table ({catalogData.length} Server-Rendered Rows)
        </summary>
        <div className="table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Asset Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {catalogData.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.name}</td>
                  <td>{row.category}</td>
                  <td>{row.status}</td>
                  <td>{row.stock}</td>
                  <td>
                    <a href={`?inspect=${row.id}`} className="inspect-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
                      <button>Inspect</button>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      {/* FEATURE 5: Server-Rendered Modal Dialog */}
      {selectedItem && (
        <dialog open className="native-dialog">
          <h2>Asset Inspection Details</h2>
          <div style={{ margin: '15px 0' }}>
            <p><strong>ID:</strong> {selectedItem.id}</p>
            <p><strong>Name:</strong> {selectedItem.name}</p>
            <p><strong>Category:</strong> {selectedItem.category}</p>
            <p><strong>Status:</strong> {selectedItem.status}</p>
            <p><strong>Current Stock Level:</strong> {selectedItem.stock} units</p>
          </div>

          <a href="?" style={{ textDecoration: 'none' }}>
            <button>Close Window</button>
          </a>
        </dialog>
      )}
    </main>
  );
}

export default function Page({ searchParams }: { searchParams: Promise<{ inspect?: string }> }) {
  return (
    <Suspense fallback={<main className="dashboard-container"><p>Loading server-rendered dashboard...</p></main>}>
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}

