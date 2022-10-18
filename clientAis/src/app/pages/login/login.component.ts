import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NbComponentStatus, NbGlobalPhysicalPosition, NbGlobalPosition, NbToastrService } from '@nebular/theme';
import { FacesService } from '../../services/faces.service';

@Component({
  selector: 'ngx-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  registerForm: FormGroup;
  loading: boolean = false;
  submitted: boolean = false;
  error:any = {
    err: false,
    message : ''
  };
  isLoggedIn = false;
  isLoginFailed = false;
  errorMessage = '';
  roles: string[] = [];
  values = {
    username: 'primary',
    password: 'primary',
    login: 'primary'
  }

  constructor(    
    private formBuilder: FormBuilder,
    public router: Router,
    private toastrService: NbToastrService,
    private face: FacesService,
    ) { }

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
    });
  }

  get f() { return this.registerForm.controls; }

  loginDisplay: boolean = false

  onSubmit(){
    this.submitted = true;
    this.loading = true;
    this.values = {
      username: 'primary',
      password: 'primary',
      login: 'primary'
    }

    this.face.login(this.registerForm.value).subscribe(
      data => {
        this.saveUser(data.user);
        this.isLoggedIn = true
        window.location.reload()
      },
      err => {
        this.errorMessage = err.error.message;
        if(err.error.type == 'user'){
          this.values.username = 'danger'
          this.registerForm.controls['username'].setErrors({required:true})
        }
        if(err.error.type == 'pass'){
          this.values.password = 'danger'
          this.registerForm.controls['password'].setErrors({required:true})
        }
        if(err.error.type == 'disable'){
          this.values.login = 'danger'
          this.showToast(err.error.message)
        }
        if(err.error.type == 'logged'){
          this.values.login = 'danger'
          this.values.username = 'danger'
          this.values.password = 'danger'
          this.showToast(err.error.message)
        }
        this.loading = false;
      }
    );
  }

  public saveUser(user) {
    const USER_KEY = 'usr';
    const TOKEN = 'auth-token';
    localStorage.removeItem(TOKEN)
    localStorage.setItem(TOKEN , user.accessToken)
    localStorage.removeItem(USER_KEY)
    localStorage.setItem(USER_KEY , JSON.stringify(user))
  }

  reloadPage() {
    window.location.reload();
  }

  destroyByClick = true;
  duration = 10000;
  hasIcon = true;
  position: NbGlobalPosition = NbGlobalPhysicalPosition.TOP_RIGHT;
  preventDuplicates = false;
  status: NbComponentStatus = 'warning';
  
  private showToast( body: string) {
    const config = {
      status: this.status,
      destroyByClick: this.destroyByClick,
      duration: this.duration,
      hasIcon: this.hasIcon,
      position: this.position,
      preventDuplicates: this.preventDuplicates,
    };
    const titleContent = 'Warning';

    this.toastrService.show(
      body,
      `${titleContent}`,
      config);
  }

}
