import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DisplayService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCurrentDisplay(): Observable<{ imageUrl: string }> {
    return this.http.get<{ imageUrl: string }>(`${this.apiUrl}/display/current`);
  }

  updateDisplayWithText(text: string, options: any = {}): Observable<any> {
    return this.http.post(`${this.apiUrl}/display/text`, { text, options });
  }

  updateDisplayWithImage(image: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', image);
    return this.http.post(`${this.apiUrl}/display/image`, formData);
  }

  getPlugins(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/plugins`);
  }

  clearDisplay(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/clear`, {}).pipe(
      catchError(this.handleError)
    );
  }

  updateDisplay(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/update`, {}).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
} 