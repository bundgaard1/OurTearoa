import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface HealthResponse {
  status: string;
  timestamp: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',  // <--- Must match your file name 'app.html'
  styleUrl: './app.scss'      // <--- Must match your file name 'app.scss' (if using one)
})
export class App implements OnInit {
  private http = inject(HttpClient);
  
  healthData = signal<HealthResponse | null>(null);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.http.get<HealthResponse>('http://localhost:3000/api/health').subscribe({
      next: (data) => this.healthData.set(data),
      error: (err) => {
        console.error('Failed to connect to backend', err);
        this.error.set('Could not reach Express server');
      }
    });
  }
}