import StatusForm from "@/components/status-form"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Status Report Generator</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create polished, executive-ready status reports with real-time preview
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Auto-save enabled</span>
              </div>
              <div className="hidden sm:block">•</div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Secure & private</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <StatusForm />
      </div>

      <footer className="border-t border-border/50 bg-muted/30 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground">
            <div>
              <h3 className="font-medium text-foreground mb-2">Features</h3>
              <ul className="space-y-1">
                <li>• Real-time preview & export</li>
                <li>• Customizable design options</li>
                <li>• Automatic data persistence</li>
                <li>• Security-first approach</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-2">Export Options</h3>
              <ul className="space-y-1">
                <li>• Copy HTML to clipboard</li>
                <li>• Download as HTML file</li>
                <li>• Self-contained styling</li>
                <li>• Email & document ready</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-2">Privacy & Security</h3>
              <ul className="space-y-1">
                <li>• All data stored locally</li>
                <li>• No server uploads</li>
                <li>• Content sanitization</li>
                <li>• Safe HTML generation</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
